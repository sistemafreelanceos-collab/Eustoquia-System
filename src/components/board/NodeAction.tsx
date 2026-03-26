'use client';
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Send, Loader2, Zap, CheckCircle2 } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';

const NodeAction = ({ id, data, selected }: any) => {
  const [webhookUrl, setWebhookUrl] = useState(data.url || '');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { nodes, edges, syncNode } = useBoardStore();

  const saveUrl = (url: string) => {
    setWebhookUrl(url);
    const node = nodes.find(n => n.id === id);
    if (node) syncNode({ ...node, data: { ...node.data, url } });
  };

  const handleFire = async () => {
    if (!webhookUrl.trim()) {
      alert('Primero pega la URL del webhook de n8n');
      return;
    }

    // Recolectar el último mensaje del asistente de los chats conectados
    const connectedNodeIds = edges
      .filter(e => e.target === id || e.source === id)
      .map(e => e.target === id ? e.source : e.target);

    const connectedChats = nodes.filter(n => connectedNodeIds.includes(n.id) && n.type === 'chat');
    
    if (connectedChats.length === 0) {
      alert('Conecta un nodo de Chat IA a este nodo primero.');
      return;
    }

    // Tomar el último mensaje del asistente
    const allMessages = connectedChats.flatMap(n => n.data?.messages || []);
    const lastAssistantMsg = [...allMessages].reverse().find((m: any) => m.role === 'assistant');
    
    if (!lastAssistantMsg) {
      alert('No hay mensajes del asistente para enviar. Genera contenido primero en el Chat IA.');
      return;
    }

    setLoading(true);
    setLastStatus('idle');

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: lastAssistantMsg.text,
          source: 'Eustoquia System',
          timestamp: new Date().toISOString(),
          nodeId: id,
        }),
      });

      if (res.ok) {
        setLastStatus('success');
        setTimeout(() => setLastStatus('idle'), 3000);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error('Webhook error:', err);
      setLastStatus('error');
      alert(`Error enviando al webhook: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`custom-action-node p-4 rounded-2xl flex flex-col gap-3 w-full h-full ${selected ? 'selected' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}
        >
          <Zap size={14} fill="currentColor" />
        </div>
        <div>
          <div className="text-[#E4E4EE] text-xs font-bold uppercase tracking-wider">{data.title || 'Enviar a n8n'}</div>
          <div className="text-[#555568] text-[9px] font-mono">Webhook / Automatización</div>
        </div>
      </div>

      {/* URL Input */}
      <input
        type="text"
        value={webhookUrl}
        onChange={e => setWebhookUrl(e.target.value)}
        onBlur={e => saveUrl(e.target.value)}
        placeholder="https://tu-n8n.com/webhook/..."
        className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-mono outline-none transition-all"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,71,87,0.2)',
          color: '#E4E4EE',
        }}
      />

      {/* Fire Button */}
      <button
        onClick={handleFire}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
        style={{
          background: lastStatus === 'success'
            ? 'rgba(0,214,143,0.2)'
            : 'rgba(255,71,87,0.15)',
          border: lastStatus === 'success'
            ? '1px solid rgba(0,214,143,0.4)'
            : '1px solid rgba(255,71,87,0.35)',
          color: lastStatus === 'success' ? '#00D68F' : '#FF4757',
          boxShadow: lastStatus === 'success'
            ? '0 0 12px rgba(0,214,143,0.2)'
            : loading ? 'none' : '0 0 12px rgba(255,71,87,0.15)',
        }}
      >
        {loading
          ? <><Loader2 size={12} className="animate-spin" /> Enviando...</>
          : lastStatus === 'success'
          ? <><CheckCircle2 size={12} /> ¡Enviado!</>
          : <><Send size={12} /> Disparar Webhook</>
        }
      </button>

      {/* Handle de entrada (izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#FF4757',
          width: 10,
          height: 10,
          border: '2px solid #0C0C14',
          left: -5,
        }}
      />
    </div>
  );
};

export default NodeAction;
