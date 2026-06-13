// Adaptador de dados do modulo Financeiro contra o Supabase.
// Substitui o storage local (window.storage) que o app usa nativamente.
//
// Tabelas no banco (ja criadas via migration 0001_financeiro.sql):
//   - financeiro_state (jsonb por user_id) — estado completo do app
//   - financeiro_grants (text email PK) — quem comprou e pode usar
//   - has_financeiro() — RPC que retorna boolean (true se o e-mail logado liberado)
//
// RLS bloqueia tudo no servidor caso has_financeiro() = false; mesmo que
// alguem burle o gate na UI, nao consegue ler/gravar.

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function hasFinanceiro(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_financeiro')
  if (error) {
    console.error('[financeiro] has_financeiro:', error)
    return false
  }
  return !!data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadState(): Promise<any | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('financeiro_state')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[financeiro] loadState:', error)
    return null
  }
  return data?.data ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveState(state: any): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('financeiro_state')
    .upsert(
      { user_id: user.id, data: state, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) console.error('[financeiro] saveState:', error)
}
