import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

const NodeGroup = ({ data, selected }: NodeProps) => {
  const color = data.color || '#E8621A';
  
  return (
    <>
      <NodeResizer color={color} isVisible={selected} minWidth={320} minHeight={220} />
      <div className="w-full h-full flex flex-col rounded-[20px]">
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3 shrink-0"
          style={{ borderBottom: `1px solid ${color}25` }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="text-[#E4E4EE] text-[13px] font-semibold flex-1 truncate tracking-tight">
            {data.title}
          </span>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold shrink-0"
            style={{ background: `${color}18`, color: color, border: `1px solid ${color}35` }}
          >
            <span>{data.itemsCount || 0} items</span>
          </div>
          <div
            className="w-6 h-6 rounded-full border shrink-0 flex items-center justify-center"
            style={{ borderColor: `${color}50`, background: `${color}12` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ border: `1.5px solid ${color}` }} />
          </div>
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: color, width: 10, height: 10, right: -5, border: `2px solid #0F0F16` }}
          />
        </div>

        {/* Content — hijos de React Flow van aquí */}
        <div className="flex-1 relative" />

        {/* Footer */}
        <div
          className="px-4 py-2.5 text-center shrink-0"
          style={{ borderTop: `1px solid ${color}18` }}
        >
          <span className="text-[10px] font-mono" style={{ color: `${color}60` }}>
            ↓ arrastra URLs, archivos o notas de voz aquí
          </span>
        </div>
      </div>
    </>
  );
};

export default NodeGroup;
