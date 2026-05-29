'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { entrar } from './actions'

export default function EntrarPage() {
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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-preto mb-2">Bússola</h1>
          <p className="text-chumbo text-sm">Acesso do gestor</p>
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label !mb-0">Senha</label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-text-muted hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
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

            {error && (
              <p className="text-vinho text-sm text-center">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
