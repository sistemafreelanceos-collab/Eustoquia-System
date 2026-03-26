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
  activeBoardId: string | null;
  userId: string | null;
  setUserId: (id: string | null) => void;
  fetchBoard: (boardId: string) => Promise<void>;
  syncNode: (node: Node) => Promise<void>;
  syncEdge: (edge: Edge) => Promise<void>;
  removeElements: (nodes: Node[], edges: Edge[]) => Promise<void>;
  supabase: any;
}

const INITIAL_NODES: Node[] = [];
const INITIAL_EDGES: Edge[] = [];

export const useBoardStore = create<BoardState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  activeBoardId: null,
  userId: null,
  supabase: supabase,
  
  setUserId: (id: string | null) => set({ userId: id }),
  
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

  onEdgesChange: (changes: EdgeChange[]) => {
    const prevEdges = get().edges;
    const newEdges = applyEdgeChanges(changes, prevEdges);
    set({ edges: newEdges });
  },
  onConnect: (connection: Connection) => {
    const newEdge = { ...connection, id: crypto.randomUUID(), animated: true, style: { stroke: '#6C5CE7' } } as Edge;
    const newEdges = addEdge(newEdge, get().edges);
    set({ edges: newEdges });
    get().syncEdge(newEdge);
  },
  
  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),
  
  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
    get().syncNode(node); // Sync immediately
  },

  fetchBoard: async (boardId: string) => {
    if (!supabase) return; 
    // Limpiar el canvas ANTES de cargar el nuevo tablero
    set({ activeBoardId: boardId, nodes: [], edges: [] });
    try {
      const { data: dbGroups } = await supabase.from('groups').select('*').eq('board_id', boardId);
      const { data: dbNodes } = await supabase.from('nodes').select('*').eq('board_id', boardId);
      const { data: dbEdges } = await supabase.from('connections').select('*').eq('board_id', boardId);
      
      const reactFlowNodes: Node[] = [];
      const reactFlowEdges: Edge[] = [];

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
            parentNode: n.group_id || undefined,
            extent: n.group_id ? 'parent' : undefined,
            zIndex: n.type === 'chat' ? 50 : 10,
          });
        });
      }

      // Mapear conexiones
      if (dbEdges) {
        dbEdges.forEach(e => {
          reactFlowEdges.push({
            id: e.id || `${e.from_id}-${e.to_id}`,
            source: e.from_id,
            target: e.to_id,
            animated: true,
            style: { stroke: '#6C5CE7' }
          });
        });
      }

      // Filtrar nodos huérfanos (con parentNode que no existe en este tablero)
      const groupIds = new Set(reactFlowNodes.filter(n => n.type === 'group').map(n => n.id));
      const safeNodes = reactFlowNodes.filter(n => {
        if (n.type === 'group') return true;
        if (!n.parentNode) return true;
        return groupIds.has(n.parentNode); // solo mantener si el padre existe
      });

      set({ nodes: safeNodes, edges: reactFlowEdges });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  },

  syncNode: async (node: Node) => {
    if (!supabase || !get().activeBoardId) {
      console.warn("SyncNode skipped: No supabase or activeBoardId");
      return;
    }
    try {
      if (node.type === 'group') {
        // Sincronizar en tabla 'groups'
        const payload = {
          id: node.id,
          board_id: get().activeBoardId,
          title: node.data?.title || 'Grupo',
          x_position: Math.round(node.position.x),
          y_position: Math.round(node.position.y),
          width: node.style?.width || 400,
          height: node.style?.height || 300,
          color: node.data?.color || '#E8621A',
          content: node.data || {},
          user_id: get().userId,
        };
        const { error } = await supabase.from('groups').upsert(payload, { onConflict: 'id' });
        if (error) console.error("Error syncing group:", error.message);
      } else {
        // Sincronizar en tabla 'nodes'
        const payload = {
          id: node.id,
          board_id: get().activeBoardId,
          group_id: node.parentNode || null,
          title: node.data?.title || 'Node',
          type: node.type || 'basic',
          x_position: Math.round(node.position.x),
          y_position: Math.round(node.position.y),
          width: typeof node.style?.width === 'number' ? node.style.width : 280,
          height: typeof node.style?.height === 'number' ? node.style.height : 150,
          color: node.data?.color || '#6C5CE7',
          content: node.data || {},
          user_id: get().userId,
        };
        const { error } = await supabase.from('nodes').upsert(payload, { onConflict: 'id' });
        if (error) console.error("Error syncing node:", error.message);
      }
    } catch (e) {
      console.error("Critical SyncNode Error:", e);
    }
  },

  syncEdge: async (edge: Edge) => {
    if (!supabase || !get().activeBoardId) {
      console.warn("SyncEdge saltado: No hay supabase o activeBoardId", get().activeBoardId);
      return;
    }
    try {
      const payload: any = {
        id: edge.id,
        board_id: get().activeBoardId,
        from_id: edge.source,
        to_id: edge.target,
        user_id: get().userId
      };
      
      console.log("Sincronizando Edge en DB:", edge.id);
      
      const { error } = await supabase.from('connections').upsert({
        ...payload,
        from_type: 'node',
        to_type: 'node',
        style: edge.style
      }, { onConflict: 'id' });

      if (error) {
        if (error.message.includes('column')) {
          console.log("Reintentando syncEdge con payload básico...");
          await supabase.from('connections').upsert(payload, { onConflict: 'id' });
        } else {
          console.error("Error persistiendo Edge:", error.message);
        }
      }
    } catch (e) {
      console.error("Critical SyncEdge Error:", e);
    }
  },

  removeElements: async (nodesToRemove: Node[], edgesToRemove: Edge[]) => {
    if (!supabase) return;
    try {
      // Eliminar del estado local
      const nodeIds = nodesToRemove.map(n => n.id);
      const edgeIds = edgesToRemove.map(e => e.id);

      set({
        nodes: get().nodes.filter(n => !nodeIds.includes(n.id)),
        edges: get().edges.filter(e => !edgeIds.includes(e.id))
      });

      // Eliminar de Supabase
      if (nodeIds.length > 0) {
        await supabase.from('nodes').delete().in('id', nodeIds);
        await supabase.from('groups').delete().in('id', nodeIds);
      }
      if (edgeIds.length > 0) {
        await supabase.from('connections').delete().in('id', edgeIds);
      }
    } catch (e) {
      console.error("Error removing elements:", e);
    }
  }
}));
