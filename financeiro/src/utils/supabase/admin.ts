import { createClient } from '@supabase/supabase-js'

// Cliente com service_role — IGNORA RLS. Usar SOMENTE no servidor,
// nunca expor a chave no browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
