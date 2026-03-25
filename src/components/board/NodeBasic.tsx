import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Mic, Image as ImageIcon, FileText, Type, Link as LinkIcon, Music } from 'lucide-react';

const NODE_TYPES_CONFIG: Record<string, any> = {
  youtube: { icon: <Play size={14} fill="currentColor" />, color: "#FF4444", bg: "rgba(255,68,68,0.06)", border: "rgba(255,68,68,0.2)" },
  audio: { icon: <Mic size={14} />, color: "#F5A623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)" },
  image: { icon: <ImageIcon size={14} />, color: "#00D2FF", bg: "rgba(0,210,255,0.06)", border: "rgba(0,210,255,0.2)" },
  document: { icon: <FileText size={14} />, color: "#6C5CE7", bg: "rgba(108,92,231,0.15)", border: "rgba(108,92,231,0.25)" },
  note: { icon: <Type size={14} />, color: "#A29BFE", bg: "rgba(162,155,254,0.06)", border: "rgba(162,155,254,0.2)" },
  link: { icon: <LinkIcon size={14} />, color: "#00D68F", bg: "rgba(0,214,143,0.08)", border: "rgba(0,214,143,0.2)" },
  voicenote: { icon: <Mic size={14} />, color: "#FF6B9D", bg: "rgba(255,107,157,0.06)", border: "rgba(255,107,157,0.2)" },
};

const NodeBasic = ({ data, selected }: NodeProps) => {
  const nt = NODE_TYPES_CONFIG[data.type] || NODE_TYPES_CONFIG.note;
  
  return (
    <div 
      className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all duration-150 min-w-[240px] ${
        selected ? 'ring-2 ring-white/10 shadow-lg' : ''
      }`}
      style={{
        background: nt.bg,
        borderColor: nt.border,
        zIndex: 10,
        position: 'relative'
      }}
    >
      <div 
        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border"
        style={{ 
          background: `${nt.color}18`, 
          borderColor: `${nt.color}30`,
          color: nt.color
        }}
      >
        {nt.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-[#E4E4EE] text-xs font-semibold mb-0.5 truncate">
          {data.title}
        </div>
        <div className="text-[#9999B0] text-[10px] leading-relaxed">
          {data.meta}
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2 !h-2 !bg-[#252535] !border-none" 
      />
    </div>
  );
};

export default NodeBasic;
