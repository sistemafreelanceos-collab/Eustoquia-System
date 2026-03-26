import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown, Send, Sparkles, Plus, Loader2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';

const ModelBadge = ({ model }: { model: string }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold shrink-0"
    style={{ background: 'rgba(108,92,231,0.15)', color: '#A29BFE', border: '1px solid rgba(108,92,231,0.25)' }}
  >
    <Sparkles size={10} />
    <span>{model}</span>
    <ChevronDown size={9} />
  </div>
);

const ActionButton = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all hover:brightness-125 disabled:opacity-50 whitespace-nowrap"
    style={{ background: 'rgba(108,92,231,0.12)', color: '#A29BFE', border: '1px solid rgba(108,92,231,0.2)' }}
  >
    {label}
  </button>
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

const NodeChat = ({ id, data, selected }: any) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { nodes, edges, syncNode } = useBoardStore();

  const handleAction = (action: string) => {
    let prompt = '';
    switch(action) {
      case 'Resumir': prompt = 'Por favor, haz un resumen ejecutivo de todo el contexto conectado.'; break;
      case 'Ganchos': prompt = 'Genera 5 "hooks" o ganchos de alto impacto para un video de Instagram basado en este contenido.'; break;
      case 'Guion': prompt = 'Crea un guion detallado para un video de 60 segundos basado en esta información.'; break;
    }
    setInputText(prompt);
    setTimeout(() => handleSend(prompt), 100);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user', text: textToSend };
    const newMessages = [...(data.messages || []), userMessage];
    
    // Actualizar localmente inmediatamente
    // Nota: Usamos el store para actualizar el nodo específico
    const intermediateNodes = useBoardStore.getState().nodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, messages: newMessages } } : n
    );
    useBoardStore.getState().setNodes(intermediateNodes);
    
    setInputText('');
    setIsLoading(true);

    // Recolectar contexto de nodos conectados
    const connectedNodeIds = edges
      .filter(e => e.target === id || e.source === id)
      .map(e => e.target === id ? e.source : e.target);
    
    const contextContent = nodes
      .filter(n => connectedNodeIds.includes(n.id))
      .map(n => `[Nodo: ${n.data?.title || 'Sin título'}] (${n.type}) - Contenido: ${n.data?.fullContent || JSON.stringify(n.data)}`)
      .join('\n\n');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
          context: contextContent
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API Error ${response.status}:`, errorBody);
        throw new Error(`Error en la API de Claude (${response.status})`);
      }

      // Preparar streaming de respuesta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          assistantText += decoder.decode(value, { stream: true });
          
          // Actualizar la UI en cada pedazo (chunk)
          const intermediateMessages = [...newMessages, { role: 'assistant', text: assistantText }];
          useBoardStore.getState().setNodes(
            useBoardStore.getState().nodes.map(n => 
              n.id === id ? { ...n, data: { ...n.data, messages: intermediateMessages } } : n
            )
          );
        }
      }

      // Sincronizar estado final con DB
      const finalNode = useBoardStore.getState().nodes.find(n => n.id === id);
      if (finalNode) syncNode(finalNode);

    } catch (error: any) {
      console.error('Chat Error:', error);
      let errorMessage = 'Lo siento, hubo un error al conectar con Claude.';
      
      try {
        // Intentar extraer el error detallado si es posible
        if (error.response) {
          const data = await error.response.json();
          errorMessage = `${errorMessage} Detalle: ${data.details || data.error || error.message}`;
        }
      } catch (e) {}

      const errorMsg = { role: 'assistant', text: errorMessage };
      const currentMessages = useBoardStore.getState().nodes.find(n => n.id === id)?.data?.messages || newMessages;
      const errorData = { ...data, messages: [...currentMessages, errorMsg] };
      
      useBoardStore.getState().setNodes(
        useBoardStore.getState().nodes.map(n => 
          n.id === id ? { ...n, data: errorData } : n
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Pestañas de contexto dinámicas basadas en conexiones reales
  const connectedNodes = edges
    .filter(e => e.target === id || e.source === id)
    .map(e => e.target === id ? nodes.find(n => n.id === e.source) : nodes.find(n => n.id === e.target))
    .filter(Boolean);

  const contextTabs = connectedNodes.map(n => ({
    id: n!.id,
    label: (n!.data?.title || n!.type || 'Nodo').substring(0, 15),
    type: n!.type
  }));

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

      {/* Quick Actions (Poppy Style) */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-white/5 border-b border-white/5 scrollbar-hide">
        <ActionButton label="Resumir" onClick={() => handleAction('Resumir')} disabled={isLoading} />
        <ActionButton label="Ganchos" onClick={() => handleAction('Ganchos')} disabled={isLoading} />
        <ActionButton label="Guion" onClick={() => handleAction('Guion')} disabled={isLoading} />
      </div>

      {/* Context Tabs */}
      {contextTabs.length > 0 && (
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 border-b border-white/5 bg-white/5 scrollbar-hide">
          {contextTabs.map(tab => (
            <ContextTab key={tab.id} label={tab.label} active />
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
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isLoading ? "Claude está pensando..." : "Escribe un mensaje..."}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs outline-none rounded-xl transition-all"
          style={{
            background: 'rgba(8,8,13,0.8)',
            border: '1px solid rgba(37,37,53,0.8)',
            color: '#E4E4EE',
            opacity: isLoading ? 0.6 : 1
          }}
        />
        <button 
          onClick={() => handleSend()}
          disabled={isLoading || !inputText.trim()}
          className="w-10 h-10 rounded-xl bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(108,92,231,0.3)]"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
};

export default NodeChat;
