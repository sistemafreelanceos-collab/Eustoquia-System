import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  Connection, Edge, EdgeChange, Node, NodeChange,
  addEdge, OnNodesChange, OnEdgesChange, OnConnect,
  applyNodeChanges, applyEdgeChanges
} from 'reactflow';

export interface BoardState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  fetchBoard: (boardId: string) => Promise<void>;
  syncNode: (node: Node) => Promise<void>;
}

const INITIAL_NODES: Node[] = [];
const INITIAL_EDGES: Edge[] = [];

export const useBoardStore = create<BoardState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  
  onNodesChange: (changes: NodeChange[]) => {
    const prevNodes = get().nodes;
    const newNodes = applyNodeChanges(changes, prevNodes);
    set({ nodes: newNodes });

    // Sync to DB gracefully: only when drag ends or dimensions change
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false) {
        const node = newNodes.find(n => n.id === change.id);
        if (node) get().syncNode(node);
      }
      if (change.type === 'dimensions') {
        const node = newNodes.find(n => n.id === change.id);
        if (node) get().syncNode(node);
      }
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection: Connection) => set({ edges: addEdge({ ...connection, animated: true, style: { stroke: '#6C5CE7' } }, get().edges) }),
  
  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),
  
  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
    get().syncNode(node); // Sync immediately
  },

  fetchBoard: async (boardId: string) => {
    if (!supabase) return; 
    try {
      const { data: dbGroups } = await supabase.from('groups').select('*').eq('board_id', boardId);
      const { data: dbNodes } = await supabase.from('nodes').select('*').eq('board_id', boardId);
      
      const reactFlowNodes: Node[] = [];

      // Mapear grupos
      if (dbGroups) {
        dbGroups.forEach(g => {
          reactFlowNodes.push({
            id: g.id,
            type: 'group',
            className: 'custom-group-node',
            data: g.content || { title: g.title, color: g.color || '#E8621A' },
            position: { x: Number(g.x_position), y: Number(g.y_position) },
            style: { width: Number(g.width), height: Number(g.height) },
            zIndex: -1,
          });
        });
      }

      // Mapear nodos
      if (dbNodes) {
        dbNodes.forEach(n => {
          reactFlowNodes.push({
            id: n.id,
            type: n.type,
            className: n.type === 'chat' ? 'custom-chat-node' : 'custom-basic-node',
            data: n.content || { title: n.title },
            position: { x: Number(n.x_position), y: Number(n.y_position) },
            style: { width: Number(n.width) || undefined, height: Number(n.height) || undefined },
            // parentNode: n.group_id?  // Se puede implementar la relación en DB más tarde
            zIndex: n.type === 'chat' ? 50 : 10,
          });
        });
      }

      set({ nodes: reactFlowNodes });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  },

  syncNode: async (node: Node) => {
    if (!supabase) return;
    try {
      const isGroup = node.type === 'group';
      const table = isGroup ? 'groups' : 'nodes';
      const payload = {
        id: node.id,
        board_id: node.data?.boardId || '22222222-2222-2222-2222-222222222222', // O usar estado global de tablero activo
        title: node.data?.title || 'Nuevo',
        x_position: Math.round(node.position.x),
        y_position: Math.round(node.position.y),
        width: typeof node.style?.width === 'number' ? node.style.width : 300,
        height: typeof node.style?.height === 'number' ? node.style.height : 100,
        type: node.type,
        color: node.data?.color || '#00D68F',
        content: node.data
      };

      const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
      if (error) console.error("Supabase Error saving node:", error.message);
    } catch (e) {
      console.error("Error syncing node to Supabase:", e);
    }
  }
}));
