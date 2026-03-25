import { createClient as createBrowserClient } from '@/lib/supabase/client';

// Singleton para uso en store de Zustand y componentes cliente
export const supabase = createBrowserClient();
