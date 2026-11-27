import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Depois do login: cada um para a sua área. */
export default async function Inicio() {
  const { supabase, user } = await usuarioAtual()
  if (!user) redirect('/entrar')
  const { data: ehAdmin } = await supabase.rpc('is_admin')
  if (ehAdmin) redirect('/admin')
  redirect('/')
}
