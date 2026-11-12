import { createClient } from '@supabase/supabase-js'

/**
 * Service role — IGNORA RLS. Só no servidor, schema "tarefix".
 * Usado em todo acesso do COLABORADOR (que não tem Supabase Auth): as rotas
 * validam token + sessão do PIN e então usam este cliente, sempre filtrando
 * por empresa_id/colaborador_id na mão.
 */
export function createTarefixAdmin() {
  if (typeof window !== 'undefined') throw new Error('createTarefixAdmin só no servidor')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    db: { schema: 'tarefix' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
