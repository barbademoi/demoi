import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente do navegador do Tarefix — telas do DONO.
 * Mesmo projeto Supabase do BarberMeta, mas apontando para o schema "tarefix".
 */
export function createTarefixClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'tarefix' } }
  )
}
