'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { entrar } from './actions'

interface Props {
  msg?: string
}

const MENSAGENS: Record<string, { titulo: string; texto: string }> = {
  conta_criada: {
    titulo: 'Conta criada',
    texto: 'Confirme seu email (se pedirmos) e entre com sua senha.',
  },
  confirme_email: {
    titulo: 'Confirme seu email',
    texto: 'Enviamos um link de confirmação. Depois de confirmar, entre por aqui.',
  },
}

export function EntrarForm({ msg }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await entrar(formData)
      if (result?.error) setError(result.error)
    })
  }

  const m = msg ? MENSAGENS[msg] : null

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold tracking-[1.5px] text-primary uppercase">Controle Financeiro</div>
          <p className="text-faint text-sm mt-2">Acesso da sua barbearia</p>
        </div>

        {m && (
          <div className="mb-5 rounded-lg border border-primary/20 bg-surface-2 p-4 text-sm">
            <p className="font-semibold text-ink">{m.titulo}</p>
            <p className="text-ink-soft mt-1 leading-relaxed">{m.texto}</p>
          </div>
        )}

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@email.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && <p className="text-saida text-sm text-center">{error}</p>}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-faint text-sm mt-6">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
