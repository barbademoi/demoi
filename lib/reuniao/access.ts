// Checagem client-side de acesso ao módulo de Reunião (PREVIEW/PLUS).
// Lê o e-mail da sessão do Supabase no browser e compara com a allowlist.
// A trava REAL é no servidor (página /dashboard/reuniao e as actions) — isto
// aqui só controla a exibição do item no menu, sem flash.

import { createClient } from '@/lib/supabase/client'
import { emailTemReuniao } from './preview'

const supabase = createClient()

export async function hasReuniao(): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('[reuniao] hasReuniao:', error)
    return false
  }
  return emailTemReuniao(user?.email ?? null)
}
