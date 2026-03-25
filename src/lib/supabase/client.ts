import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Solo creamos el cliente si la URL es válida
  return supabaseUrl.startsWith('http')
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : null;
}
