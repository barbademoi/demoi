'use client'

import { useState, useTransition } from 'react'
import { redefinirSenha } from './actions'

export default function RedefinirSenhaPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await redefinirSenha(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Definir nova senha</h1>
          <p className="text-text-muted text-sm">Escolha uma nova senha de acesso.</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="senha" className="label">Nova senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="confirmar" className="label">Confirmar senha</label>
              <input
                id="confirmar"
                name="confirmar"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p className="text-vinho text-sm text-center">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
