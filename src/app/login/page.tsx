'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (isSignUp: boolean) => {
    if (!supabase) {
      setErrorMsg("Error: Supabase no está configurado.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setErrorMsg(error.message);
        else setErrorMsg('Revisa tu correo para verificar tu cuenta (o simplemente inicia sesión si el auto-confirm está activado).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080D] flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6C5CE7]/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-sm bg-[#111118]/80 backdrop-blur-xl border border-[#252535] rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] flex items-center justify-center text-white font-space font-extrabold text-2xl shadow-[0_0_20px_rgba(108,92,231,0.4)]">
            E
          </div>
        </div>
        
        <h1 className="text-center font-space text-2xl font-bold text-[#E4E4EE] mb-2 tracking-tight">Eustoquia System</h1>
        <p className="text-center text-[#555568] text-sm mb-8">Ingresa a tu workspace privado</p>

        <form onSubmit={(e) => { e.preventDefault(); handleAuth(false); }} className="space-y-4">
          <div>
            <label className="block text-[#9999B0] text-xs font-semibold mb-1.5 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#08080D] border border-[#252535] rounded-xl px-4 py-3 text-[#E4E4EE] text-sm outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
              placeholder="tu@email.com"
              required 
            />
          </div>
          <div>
            <label className="block text-[#9999B0] text-xs font-semibold mb-1.5 ml-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#08080D] border border-[#252535] rounded-xl px-4 py-3 text-[#E4E4EE] text-sm outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] transition-all"
              placeholder="••••••••"
              required 
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#E4E4EE] hover:bg-white text-[#08080D] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Iniciar Sesión'} <Zap size={16} className="text-[#08080D]" fill="currentColor" />
            </button>
            <button 
              type="button"
              onClick={() => handleAuth(true)}
              disabled={loading}
              className="w-full bg-transparent hover:bg-[#252535]/50 text-[#9999B0] hover:text-[#E4E4EE] text-sm font-medium py-2.5 rounded-xl transition-all border border-transparent hover:border-[#252535]"
            >
              Crear nueva cuenta
            </button>
          </div>
        </form>
      </div>

      <p className="mt-8 text-center text-[#555568] text-[10px] font-mono tracking-widest uppercase">
        Vesta Engine • Next.js • Supabase
      </p>
    </div>
  );
}
