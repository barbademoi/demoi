import { redirect } from 'next/navigation'
import { sessaoDono } from '@/lib/tarefix/dono'

export const dynamic = 'force-dynamic'

// /tarefix → painel (dono logado) ou login. Colaboradores entram pelo próprio link: /tarefix/c/[token].
export default async function TarefixInicio() {
  const s = await sessaoDono()
  redirect(s === 'sem-login' ? '/tarefix/entrar' : s === 'sem-acesso' ? '/tarefix/sem-acesso' : s === 'suspenso' ? '/tarefix/sem-acesso?motivo=suspenso' : '/tarefix/painel')
}
