'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutGrid, Sparkles, FolderOpen, MousePointer2, Type, Image as ImageIcon, Link as LinkIcon, Mic, FileText, Music, Play } from 'lucide-react';

import { useBoardStore } from '@/store/boardStore';

const Canvas = dynamic(() => import('@/components/board/Canvas'), {
  ssr: false,
  loading: () => <div className="h-screen w-screen flex items-center justify-center bg-[#08080D] text-[#9999B0] font-sans">Inicializando Workspace...</div>
});

import { useStoreApi } from 'reactflow';

export default function Home() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [boards, setBoards] = useState<any[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { fetchBoard, setUserId } = useBoardStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, [setUserId]);

  useEffect(() => {
    async function loadBoards() {
      if (!supabase) return;
      try {
        const { data } = await supabase.from('boards').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
          setBoards(data);
          setActiveBoardId(data[0].id);
          fetchBoard(data[0].id);
        }
      } catch (err) {
        console.error("Error cargando tableros:", err);
      }
    }
    loadBoards();
  }, []);

  const createBoard = async () => {
    if (!supabase) {
      alert("Conecta Supabase configurando las credenciales en .env.local para habilitar esta función.");
      return;
    }

    const newBoard = {
      project_id: '11111111-1111-1111-1111-111111111111', // UUID del seed initial
      name: 'Nuevo Tablero ' + (boards.length + 1),
      color: '#00D2FF',
    };

    const { data, error } = await supabase.from('boards').insert(newBoard).select().single();
    if (!error && data) {
      setBoards(prev => [data, ...prev]);
    } else {
      console.error("Error creando tablero:", error);
    }
  };

  const renameBoard = async (id: string, newName: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('boards').update({ name: newName }).eq('id', id);
      if (!error) {
        setBoards(prev => prev.map(b => b.id === id ? { ...b, name: newName } : b));
      } else {
        console.error("Error renombrando tablero:", error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBoard = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm('¿Eliminar tablero? Se borrará permanentemente.')) return;
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (!error) {
      const remaining = boards.filter(b => b.id !== id);
      setBoards(remaining);
      if (activeBoardId === id) {
        if (remaining.length > 0) { setActiveBoardId(remaining[0].id); fetchBoard(remaining[0].id); }
        else setActiveBoardId(null);
      }
    }
  };

  const handleSelectBoard = (id: string) => {
    // Limpiar el canvas antes de cargar el tablero nuevo para evitar "bleeding"
    useBoardStore.getState().setNodes([]);
    useBoardStore.getState().setEdges([]);
    setActiveBoardId(id);
    fetchBoard(id);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleAddNode = (type: string) => {
    const { addNode } = useBoardStore.getState();
    const id = crypto.randomUUID();

    let newNode: any = {
      id,
      position: { x: 100, y: 100 },
      data: { title: 'Nuevo ' + type, boardId: activeBoardId },
    };

    if (type === 'group') {
      newNode.type = 'group';
      newNode.style = { width: 400, height: 300 };
      newNode.data.color = '#E8621A';
      newNode.zIndex = -1;
    } else if (type === 'chat') {
      newNode.type = 'chat';
      newNode.style = { width: 400, height: 400 };
      newNode.data = { contextTabs: [], messages: [] };
      newNode.zIndex = 50;
    } else {
      newNode.type = 'basic';
      newNode.data.type = type; // youtube, mic, etc.
    }

    addNode(newNode);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      const store = useBoardStore.getState();

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = store.nodes.filter(n => (n as any).selected);
        const selectedEdges = store.edges.filter(e => (e as any).selected);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          store.removeElements(selectedNodes, selectedEdges);
        }
      }

      if (e.key.toLowerCase() === 'g') handleAddNode('group');
      if (e.key.toLowerCase() === 'c') handleAddNode('chat');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeBoardId]);

  return (
    <div className="h-screen w-screen bg-[#08080D] flex flex-col font-sans overflow-hidden">
      {/* ═══ TOP BAR ═══ */}
      <header className="h-[52px] bg-[#111118] border-b border-[#252535] flex items-center px-4 gap-3 shrink-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#FF6B9D] flex items-center justify-center text-white font-space font-extrabold text-[15px]">
            E
          </div>
          <span className="text-[#E4E4EE] font-space font-bold text-sm tracking-tight hidden md:block">
            Eustoquia
          </span>
        </div>

        <div className="w-[1px] h-6 bg-[#252535]" />

        {/* Nombre del tablero activo */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[10px]">📋</span>
          <span className="text-[#E4E4EE] text-[12px] font-semibold truncate max-w-[200px]">
            {boards.find(b => b.id === activeBoardId)?.name || 'Sin tablero'}
          </span>
        </div>

        <div className="flex-1" />

        {/* Usuario */}
        {userEmail && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {userEmail[0].toUpperCase()}
            </div>
            <span className="text-[#9999B0] text-[11px] font-mono truncate max-w-[160px]">{userEmail}</span>
          </div>
        )}

        {/* Collapse sidebar */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            showSidebar
              ? 'bg-[#6C5CE7]/15 border-[#6C5CE7]/30 text-[#6C5CE7]'
              : 'bg-transparent border-[#252535] text-[#555568] hover:text-[#9999B0]'
          }`}
          title="Toggle sidebar"
        >
          ☰
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT TOOLBAR ═══ */}
        <aside className="w-[60px] bg-[#111118] border-r border-[#252535] flex flex-col items-center py-3 gap-1 shrink-0 z-40">
          <ToolbarButton icon={<LayoutGrid size={18} />} label="Grupo" onClick={() => handleAddNode('group')} active />
          <ToolbarButton icon={<Sparkles size={16} />} label="Chat IA" onClick={() => handleAddNode('chat')} active />
          <div className="w-8 h-[1px] bg-[#252535] my-1.5" />
          <ToolbarButton icon={<Play size={16} />} label="YouTube" onClick={() => handleAddNode('youtube')} />
          <ToolbarButton icon={<Mic size={16} />} label="Audio" onClick={() => handleAddNode('mic')} />
          <ToolbarButton icon={<ImageIcon size={16} />} label="Imagen" onClick={() => handleAddNode('image')} />
          <ToolbarButton icon={<FileText size={16} />} label="Doc" onClick={() => handleAddNode('doc')} />
          <ToolbarButton icon={<Type size={16} />} label="Nota" onClick={() => handleAddNode('note')} />
          <ToolbarButton icon={<LinkIcon size={16} />} label="Link" onClick={() => handleAddNode('link')} />

          <div className="flex-1" />

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center transition-all ${showSidebar ? 'bg-[#6C5CE7]/15 text-[#6C5CE7]' : 'text-[#555568]'}`}
          >
            <FolderOpen size={18} />
          </button>
        </aside>

        {/* ═══ CANVAS ═══ */}
        <main className="flex-1 relative bg-[#08080D]">
          <Canvas />
        </main>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        {showSidebar && (
          <aside className="w-[260px] bg-[#111118] border-l border-[#252535] flex flex-col shrink-0 overflow-hidden transition-all duration-300">
            <div className="p-4 border-b border-[#252535]">
              <h3 className="text-[#E4E4EE] text-[13px] font-space font-bold">Tableros</h3>
            </div>
            <div className="p-3 flex flex-col gap-1 overflow-auto flex-1">
              {/* Dynamically mapped boards from Supabase */}
              {boards.length === 0 && (
                <p className="text-xs text-[#555568] px-2 py-4 text-center">Aún no tienes tableros. Crea uno para empezar.</p>
              )}
              {boards.map(b => (
                <BoardItem
                  key={b.id}
                  id={b.id}
                  name={b.name}
                  color={b.color || "#00D2FF"}
                  active={activeBoardId === b.id}
                  onClick={() => handleSelectBoard(b.id)}
                  onRename={renameBoard}
                  onDelete={deleteBoard}
                />
              ))}

              <button
                onClick={createBoard}
                className="mt-2 p-3 rounded-xl border border-dashed border-[#252535] text-[#555568] text-xs text-left flex items-center gap-2 hover:border-[#6C5CE7]/40 transition-all"
              >
                <span className="text-base">+</span> Nuevo tablero
              </button>

              <div className="h-[1px] bg-[#252535] my-3" />

              <p className="px-1 py-1 text-[#555568] text-[9px] font-mono uppercase tracking-widest">Atajos de teclado</p>
              <Shortcut keyName="G" desc="Nuevo grupo" />
              <Shortcut keyName="C" desc="Nuevo chat IA" />
              <Shortcut keyName="Del" desc="Eliminar selección" />
            </div>

            <div className="p-3 border-t border-[#252535] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#00D68F] shadow-[0_0_8px_rgba(0,214,143,0.4)] animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[#E4E4EE] text-[10px] font-semibold">Online</span>
                  <span className="text-[#555568] text-[9px] font-mono">Supabase Auth</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-2 py-1 rounded-md hover:bg-[#FF4757]/10 text-[#555568] hover:text-[#FF4757] text-[10px] font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-[42px] h-[42px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all group ${active ? 'bg-[#6C5CE7]/12 border border-[#6C5CE7]/30 text-[#6C5CE7]' : 'text-[#555568] hover:bg-[#1A1A24] hover:text-[#9999B0]'}`}
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[7px] font-mono uppercase tracking-wider">{label}</span>
    </button>
  );
}

function BoardItem({ id, name, color, active = false, onRename, onDelete, onClick }: { id?: string, name: string, color: string, active?: boolean, onRename?: (id: string, name: string) => void, onDelete?: (id: string) => void, onClick?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleBlurOrEnter = () => {
    if (isEditing) {
      setIsEditing(false);
      if (editValue.trim() !== name && onRename && id) {
        onRename(id, editValue.trim());
      } else {
        setEditValue(name); // Reset if empty or unchanged
      }
    }
  };

  return (
    <div
      onDoubleClick={() => { if (id && onRename) setIsEditing(true); }}
      onClick={() => { if (!isEditing && onClick) onClick(); }}
      className={`group p-3 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
        active ? 'bg-[#6C5CE7]/10 border border-[#6C5CE7]/30' : 'hover:bg-[#1A1A24]'
      }`}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleBlurOrEnter}
          onKeyDown={e => e.key === 'Enter' && handleBlurOrEnter()}
          className="bg-transparent outline-none text-[#E4E4EE] text-xs font-semibold w-full"
        />
      ) : (
        <span className={`text-xs flex-1 truncate ${active ? 'text-[#E4E4EE] font-semibold' : 'text-[#9999B0]'}`}>{name}</span>
      )}
      {!isEditing && id && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[#555568] hover:text-[#FF4757] hover:bg-[#FF4757]/15 transition-all text-sm font-bold shrink-0"
          title="Eliminar tablero"
        >
          ×
        </button>
      )}
    </div>
  );
}

function Shortcut({ keyName, desc }: { keyName: string, desc: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="min-w-[32px] text-center px-1.5 py-0.5 rounded bg-[#6C5CE7]/10 text-[#6C5CE7] text-[10px] font-mono font-bold leading-none">{keyName}</span>
      <span className="text-[#555568] text-[11px]">{desc}</span>
    </div>
  );
}
