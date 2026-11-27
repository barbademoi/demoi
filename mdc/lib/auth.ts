import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function usuarioAtual() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Confere sessão + papel admin. Sem isso, manda pro login. */
export async function requireAdmin() {
  const { supabase, user } = await usuarioAtual()
  if (!user) redirect('/entrar?next=/admin')
  const { data: ehAdmin } = await supabase.rpc('is_admin')
  if (!ehAdmin) redirect('/entrar?erro=sem-acesso')
  return { supabase, user }
}

/** Para server actions: devolve erro em vez de redirecionar. */
export async function assertAdmin() {
  const { supabase, user } = await usuarioAtual()
  if (!user) throw new Error('Sessão expirada. Entre de novo.')
  const { data: ehAdmin } = await supabase.rpc('is_admin')
  if (!ehAdmin) throw new Error('Sem permissão.')
  return { supabase, user }
}
