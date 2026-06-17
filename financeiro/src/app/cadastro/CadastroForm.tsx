'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cadastrar } from './actions'

export function CadastroForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await cadastrar(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-[11px] font-bold tracking-[1.5px] text-primary uppercase">Controle Financeiro</div>
          <p className="text-faint text-sm mt-2">Crie sua conta</p>
        </div>

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
              <p className="text-faint text-xs mt-1.5">
                Use o mesmo email da compra na Hotmart pra liberar o acesso automático.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="label">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="mínimo 6 caracteres"
                className="input"
              />
            </div>

            {error && <p className="text-saida text-sm text-center">{error}</p>}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-faint text-sm mt-6">
          Já tem conta?{' '}
          <Link href="/entrar" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
