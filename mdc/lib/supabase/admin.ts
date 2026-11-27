import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente com a service role: IGNORA o RLS. Só usar no servidor, depois de
 * conferir quem é o usuário (requireAdmin / requireMember).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
