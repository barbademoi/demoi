import { redirect } from 'next/navigation'
import { Logo } from '@/components/tarefix/Logo'
import { sessaoDono } from '@/lib/tarefix/dono'
import { FormEntrar } from './FormEntrar'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Entrar' }

export default async function Entrar() {
  const s = await sessaoDono()
  if (s === 'suspenso') redirect('/tarefix/sem-acesso?motivo=suspenso')
  if (s !== 'sem-login' && s !== 'sem-acesso') redirect('/tarefix/painel')

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <Logo className="text-5xl" />
        <p className="mt-3 text-tf-suave">Painel do dono</p>
      </div>
      <FormEntrar semAcesso={s === 'sem-acesso'} />
      <p className="text-center text-sm text-tf-suave">Colaborador? Use o link que você recebeu.</p>
    </main>
  )
}
