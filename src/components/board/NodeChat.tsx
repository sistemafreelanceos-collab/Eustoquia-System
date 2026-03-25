import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown, Send, Sparkles, Plus } from 'lucide-react';

const ModelBadge = ({ model }: { model: string }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold"
    style={{ background: 'rgba(108,92,231,0.15)', color: '#A29BFE', border: '1px solid rgba(108,92,231,0.25)' }}
  >
    <Sparkles size={10} />
    <span>{model}</span>
    <ChevronDown size={9} />
  </div>
);

const ContextTab = ({ label, active }: { label: string; active?: boolean }) => (
  <div
    className="px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap cursor-pointer transition-all"
    style={{
      background: active ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.04)',
      color: active ? '#A29BFE' : '#555568',
      border: active ? '1px solid rgba(108,92,231,0.3)' : '1px solid rgba(255,255,255,0.06)',
    }}
  >
    {label}
  </div>
);

const NodeChat = ({ data, selected }: any) => {
  const [inputText, setInputText] = useState('');

  return (
    <div className="flex flex-col w-full h-full rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(37,37,53,0.8)', background: 'rgba(0,214,143,0.04)' }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-[#00D68F] animate-pulse shrink-0"
          style={{ boxShadow: '0 0 8px rgba(0,214,143,0.7)' }} />
        <span className="text-[#E4E4EE] text-[13px] font-semibold flex-1">Chat IA</span>
        <ModelBadge model={data.model || 'Claude Sonnet 4.6'} />
        <span className="text-[#555568] cursor-pointer hover:text-[#E4E4EE] transition-colors">+</span>
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#00D68F', width: 10, height: 10, left: -5, border: '2px solid #0C0C14' }}
        />
      </div>

      {/* Context Tabs */}
      {data.contextTabs && data.contextTabs.length > 0 && (
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0"
          style={{ borderBottom: '1px solid rgba(37,37,53,0.6)', background: 'rgba(255,255,255,0.02)' }}
        >
          {data.contextTabs.map((tab: any, i: number) => (
            <ContextTab key={i} label={tab.label} active={tab.active} />
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4" style={{ minHeight: 0 }}>
        {data.messages?.map((msg: any, i: number) => (
          <div key={i} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#6C5CE7]">
                <Sparkles size={9} />
                <span>{data.model || 'Claude Sonnet 4.6'}</span>
              </div>
            )}
            <div
              className="px-3.5 py-2.5 text-[11.5px] leading-relaxed max-w-[92%]"
              style={{
                background: msg.role === 'user' ? 'rgba(108,92,231,0.18)' : 'rgba(26,26,36,0.9)',
                border: msg.role === 'user' ? '1px solid rgba(108,92,231,0.3)' : '1px solid rgba(37,37,53,0.8)',
                color: '#E4E4EE',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 flex gap-2 items-center shrink-0"
        style={{ borderTop: '1px solid rgba(37,37,53,0.8)' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3.5 py-2.5 text-xs outline-none rounded-xl transition-all"
          style={{
            background: 'rgba(8,8,13,0.8)',
            border: '1px solid rgba(37,37,53,0.8)',
            color: '#E4E4EE',
          }}
        />
        <button
          className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all"
          style={{ background: '#6C5CE7' }}
        >
          <Send size={15} color="white" />
        </button>
      </div>
    </div>
  );
};

export default NodeChat;
