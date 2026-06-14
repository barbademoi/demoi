// Cliente-side check de PLUS pra Feedback de Cliente.
// Vai bater na RPC has_feedback() que faz grandfather (criado antes do corte)
// ou checa grant ativo em feedback_grants.

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function hasFeedback(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_feedback')
  if (error) {
    console.error('[feedback] has_feedback:', error)
    return false
  }
  return !!data
}
