import { createBrowserClient } from '@supabase/ssr'

/** Cliente do navegador — usado nas telas do DONO (sessão Supabase Auth). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
