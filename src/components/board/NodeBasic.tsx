import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Play, Mic, Image as ImageIcon, FileText, Type, Link as LinkIcon, Music, Loader2, Scissors } from 'lucide-react';
import { useBoardStore } from '@/store/boardStore';

const NODE_TYPES_CONFIG: Record<string, any> = {
  youtube: { icon: <Play size={14} fill="currentColor" />, color: "#FF4444", bg: "rgba(255,68,68,0.06)", border: "rgba(255,68,68,0.2)" },
  audio: { icon: <Mic size={14} />, color: "#F5A623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)" },
  image: { icon: <ImageIcon size={14} />, color: "#00D2FF", bg: "rgba(0,210,255,0.06)", border: "rgba(0,210,255,0.2)" },
  document: { icon: <FileText size={14} />, color: "#6C5CE7", bg: "rgba(108,92,231,0.15)", border: "rgba(108,92,231,0.25)" },
  note: { icon: <Type size={14} />, color: "#A29BFE", bg: "rgba(162,155,254,0.06)", border: "rgba(162,155,254,0.2)" },
  link: { icon: <LinkIcon size={14} />, color: "#00D68F", bg: "rgba(0,214,143,0.08)", border: "rgba(0,214,143,0.2)" },
  voicenote: { icon: <Mic size={14} />, color: "#FF6B9D", bg: "rgba(255,107,157,0.06)", border: "rgba(255,107,157,0.2)" },
};

const NodeBasic = ({ id, data, selected }: NodeProps) => {
  const [loading, setLoading] = useState(false);
  const { addNode, syncNode, nodes } = useBoardStore();
  
  const nt = NODE_TYPES_CONFIG[data.type] || NODE_TYPES_CONFIG.note;

  const handleTranscribe = async () => {
    if (!data.url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url })
      });
      const result = await res.json();
      
      if (result.text) {
        // Crear una nueva nota con la transcripción al lado del video
        const newNodeId = crypto.randomUUID();
        const currentNode = nodes.find(n => n.id === id);
        
        addNode({
          id: newNodeId,
          type: 'basic',
          position: { 
            x: (currentNode?.position.x || 0) + 300, 
            y: (currentNode?.position.y || 0) 
          },
          data: { 
            type: 'note', 
            title: `Transcripción: ${data.title || 'Video'}`, 
            meta: result.text.substring(0, 500) + '...',
            fullContent: result.text
          },
          parentNode: currentNode?.parentNode
        });
      } else {
        alert(result.error || 'Error en la transcripción');
      }
    } catch (e) {
      console.error(e);
      alert('Error conectando con el servicio de transcripción');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDoc = async () => {
    if (!data.url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/process-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url })
      });
      const result = await res.json();
      
      if (result.text) {
        // Actualizar el nodo actual con el contenido extraído
        const updatedNode = nodes.find(n => n.id === id);
        if (updatedNode) {
          const newNode = { 
            ...updatedNode, 
            data: { 
              ...updatedNode.data, 
              fullContent: result.text,
              meta: `Contenido extraído (${result.length} caracteres). Listo para análisis.`
            } 
          };
          syncNode(newNode);
        }
        alert('Documento analizado con éxito. La IA ya puede leer su contenido.');
      } else {
        alert(result.error || 'Error al procesar el documento');
      }
    } catch (e) {
      console.error(e);
      alert('Error conectando con el servicio de procesamiento');
    } finally {
      setLoading(false);
    }
  };

  const updateUrl = (newUrl: string) => {
    const updatedNode = nodes.find(n => n.id === id);
    if (updatedNode) {
      const newNode = { ...updatedNode, data: { ...updatedNode.data, url: newUrl } };
      syncNode(newNode);
    }
  };
  
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
        <div className="text-[#E4E4EE] text-xs font-semibold mb-0.5 truncate uppercase tracking-tight">
          {data.title}
        </div>
        
        {data.type === 'image' && data.url && (
          <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20 aspect-video relative group/img">
            <img src={data.url} alt={data.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
               <ImageIcon size={16} className="text-white" />
            </div>
          </div>
        )}

        {(data.type === 'youtube' || data.type === 'document' || data.type === 'link') && !data.url ? (
          <input 
            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-[10px] text-white w-full outline-none focus:border-[#6C5CE7]/40 mt-1"
            placeholder={`Pega URL de ${data.type}...`}
            onBlur={(e) => updateUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateUrl((e.target as any).value)}
            autoFocus
          />
        ) : (
          <div className="text-[#9999B0] text-[10px] leading-relaxed line-clamp-2 mt-1">
            {data.meta || (data.type === 'youtube' || data.type === 'document' || data.type === 'link' ? data.url : '')}
          </div>
        )}

        {data.type === 'youtube' && data.url && (
          <button 
            onClick={handleTranscribe}
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#FF4444]/10 border border-[#FF4444]/20 text-[#FF4444] text-[9px] font-bold uppercase tracking-wider hover:bg-[#FF4444]/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={10} className="animate-spin" /> : <Scissors size={10} />}
            {loading ? 'Transcribiendo...' : 'Transcribir'}
          </button>
        )}

        {data.type === 'document' && data.url && (
          <button 
            onClick={handleProcessDoc}
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#A29BFE] text-[9px] font-bold uppercase tracking-wider hover:bg-[#6C5CE7]/25 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={10} className="animate-spin" /> : <FileText size={10} />}
            {loading ? 'Procesando...' : 'Analizar Documento'}
          </button>
        )}
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2.5 !h-2.5 !bg-[#6C5CE7] !border-2 !border-[#0C0C14] hover:!scale-125 transition-transform" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2.5 !h-2.5 !bg-[#6C5CE7] !border-2 !border-[#0C0C14] hover:!scale-125 transition-transform" 
      />
    </div>
  );
};

export default NodeBasic;
