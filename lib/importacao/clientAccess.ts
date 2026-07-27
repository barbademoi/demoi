import { createClient } from '@/lib/supabase/client'
import { emailTemImportacao } from './access'

const supabase = createClient()

/** Usado só para esconder o item do menu. A autorização real fica no server. */
export async function hasImportacao(): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('[importacao] hasImportacao:', error)
    return false
  }
  return emailTemImportacao(user?.email ?? null)
}
