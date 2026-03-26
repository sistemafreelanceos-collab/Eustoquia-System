'use client';

import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, Node as RFNode } from 'reactflow';
import { Loader2 } from 'lucide-react';
import 'reactflow/dist/style.css';

import { useBoardStore } from '@/store/boardStore';
import NodeGroup from './NodeGroup';
import NodeBasic from './NodeBasic';
import NodeChat from './NodeChat';

import NodeAction from './NodeAction';

const DEFAULT_NODE_TYPES = {
  group: NodeGroup as any,
  basic: NodeBasic as any,
  chat: NodeChat as any,
  action: NodeAction as any,
};


export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, syncNode, setNodes, addNode, userId, activeBoardId } = useBoardStore();
  const [isUploading, setIsUploading] = useState(false);

  const nodeTypes = useMemo(() => DEFAULT_NODE_TYPES, []);

  const onNodeDragStop = useCallback((_: any, node: RFNode) => {
    if (!node || !node.type) return; // Guard for undefined nodes
    if (node.type === 'group') {
      syncNode(node);
      return;
    }
    // Action nodes don't participate in group parenting
    if (node.type === 'action') {
      syncNode(node);
      return;
    }

    // Calcular colisión con grupos
    // React Flow maneja las coordenadas así:
    // Si NO tiene padre, node.position es absoluta.
    // Si TIENE padre, node.position es relativa.
    
    let absX = node.position.x;
    let absY = node.position.y;
    
    if (node.parentNode) {
      const parent = nodes.find(n => n.id === node.parentNode);
      if (parent) {
        absX += parent.position.x;
        absY += parent.position.y;
      }
    }

    const groupNode = nodes.find(n => {
      if (n.type !== 'group' || n.id === node.id) return false;
      const gWidth = Number(n.style?.width) || 400;
      const gHeight = Number(n.style?.height) || 300;
      
      return (
        absX >= n.position.x &&
        absX <= n.position.x + gWidth &&
        absY >= n.position.y &&
        absY <= n.position.y + gHeight
      );
    });

    if (groupNode && node.parentNode !== groupNode.id) {
      // ENTRAR AL GRUPO O CAMBIAR DE GRUPO
      const relativeX = absX - groupNode.position.x;
      const relativeY = absY - groupNode.position.y;
      
      const updatedNode = {
        ...node,
        parentNode: groupNode.id,
        position: { x: relativeX, y: relativeY },
        extent: 'parent' as const,
      };

      setNodes(nodes.map(n => n.id === node.id ? (updatedNode as RFNode) : n));
      syncNode(updatedNode as RFNode);
    } else if (!groupNode && node.parentNode) {
      // SALIR DEL GRUPO COMPLETAMENTE
      const updatedNode = {
        ...node,
        parentNode: undefined,
        position: { x: absX, y: absY },
        extent: undefined,
      };

      setNodes(nodes.map(n => n.id === node.id ? (updatedNode as RFNode) : n));
      syncNode(updatedNode as RFNode);
    } else {
      // Solo sincronizar posición actual
      syncNode(node);
    }
  }, [nodes, setNodes, syncNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Obtener posición del drop
    const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds || !activeBoardId || !userId) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // 1. Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await useBoardStore.getState().supabase.storage
          .from('user_assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: { publicUrl } } = useBoardStore.getState().supabase.storage
          .from('user_assets')
          .getPublicUrl(filePath);

        // 3. Determinar tipo de nodo
        let nodeType = 'note';
        if (file.type.startsWith('image/')) nodeType = 'image';
        if (file.type.startsWith('audio/')) nodeType = 'audio';
        if (file.type.includes('pdf') || file.type.includes('word')) nodeType = 'document';

        // 4. Crear nodo en el canvas
        const newNodeId = crypto.randomUUID();
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        addNode({
          id: newNodeId,
          type: 'basic',
          position,
          data: { 
            type: nodeType, 
            title: file.name, 
            url: publicUrl,
            meta: `${(file.size / 1024 / 1024).toFixed(2)} MB`
          }
        });

      } catch (error: any) {
        console.error('Error al subir archivo:', error.message);
        alert(`Error subiendo ${file.name}: ${error.message}`);
      }
    }

    setIsUploading(false);
  }, [activeBoardId, userId, addNode]);

  return (
    <div className="h-full w-full relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 30%, rgba(108,92,231,0.04) 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, rgba(0,214,143,0.03) 0%, transparent 50%)
        `,
        backgroundSize: "100% 100%, 100% 100%",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
        minZoom={0.3}
        maxZoom={2}
        snapToGrid
        snapGrid={[15, 15]}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6C5CE7', strokeWidth: 2, strokeDasharray: '8 5', opacity: 0.6 }
        }}
        multiSelectionKeyCode="Control"
      >
        <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(255,255,255,0.04)" />
        <Controls className="!bg-[#111118] !border-[#252535] !fill-[#E4E4EE] !flex !flex-col !gap-1" showInteractive={false} />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'group') return '#E8621A';
            if (n.type === 'chat') return '#00D68F';
            return 'rgba(255,255,255,0.1)';
          }}
          nodeColor={(n) => {
            if (n.type === 'group') return 'rgba(232,98,26,0.1)';
            if (n.type === 'chat') return 'rgba(0,214,143,0.1)';
            return '#1A1A24';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ backgroundColor: '#111118', border: '1px solid #252535', borderRadius: '12px' }}
          className="!bottom-4 !right-4 overflow-hidden"
        />
      </ReactFlow>

      {isUploading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3">
          <Loader2 size={40} className="animate-spin text-[#6C5CE7]" />
          <p className="text-white font-bold text-sm uppercase tracking-widest animate-pulse">Subiendo Activos...</p>
        </div>
      )}

      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
