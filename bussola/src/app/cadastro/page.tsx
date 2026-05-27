'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cadastrar } from './actions'

export default function CadastroPage() {
  const [error, setError] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await cadastrar(formData)
      if (result?.error) setError(result.error)
      else if (result?.confirmar) setConfirmar(true)
    })
  }

  if (confirmar) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-primary mb-3">Confirme seu email</h1>
          <p className="text-text-muted">
            Enviamos um link de confirmação para o seu email. Confirme para ativar a conta
            e depois faça login.
          </p>
          <Link href="/entrar" className="btn-primary w-full mt-8">
            Ir para o login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Criar conta</h1>
          <p className="text-text-muted text-sm">Comece a usar a Bússola</p>
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
                placeholder="Mínimo 6 caracteres"
                className="input"
              />
            </div>

            {error && (
              <p className="text-vinho text-sm text-center">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          Já tem conta?{' '}
          <Link href="/entrar" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
