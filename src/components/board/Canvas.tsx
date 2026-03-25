'use client';

import React from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';

import { useBoardStore } from '@/store/boardStore';
import NodeGroup from './NodeGroup';
import NodeBasic from './NodeBasic';
import NodeChat from './NodeChat';

const nodeTypes = {
  group: NodeGroup,
  basic: NodeBasic,
  chat: NodeChat,
};

export default function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useBoardStore();

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
