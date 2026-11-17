import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/tarefix/Logo'
import { sessaoDono } from '@/lib/tarefix/dono'
import { FormCriarConta } from './FormCriarConta'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Criar conta' }

export default async function CriarConta() {
  const s = await sessaoDono()
  if (s === 'sem-acesso') redirect('/tarefix/sem-acesso')
  if (s === 'suspenso') redirect('/tarefix/sem-acesso?motivo=suspenso')
  if (s !== 'sem-login') redirect('/tarefix/painel')
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <Logo className="text-5xl" />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Seu dia organizado, sem esquecer nada</h1>
        <p className="mt-1 text-tf-suave">Tarefas com horário, lembretes no celular e o termômetro do dia. Grátis.</p>
      </div>
      <FormCriarConta />
      <p className="text-center text-sm text-tf-suave">
        Já tem conta?{' '}
        <Link href="/tarefix/entrar" className="font-bold text-tf-marca-texto underline">
          Entrar
        </Link>
      </p>
    </main>
  )
}
