import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service role — IGNORA RLS. Só no servidor.
 * Usado em todo acesso do COLABORADOR (que não tem Supabase Auth): as API
 * routes validam token + sessão do PIN e então usam este cliente, sempre
 * filtrando por empresa_id/colaborador_id na mão.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
