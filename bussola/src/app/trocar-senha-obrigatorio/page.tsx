import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { FormTrocarSenha } from './FormTrocarSenha'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Crie sua senha definitiva — Bússola',
  robots: { index: false, follow: false },
}

export default async function TrocarSenhaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar')

  // Se já trocou, manda pro painel
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  if (appMeta.senha_definida !== false) redirect('/painel')

  return <FormTrocarSenha email={user.email ?? ''} userId={user.id} />
}
