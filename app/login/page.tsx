'use client'

import { useState, useTransition } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo / título */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text mb-2">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Acesso do dono da barbearia
          </p>
        </div>

        {/* Card do formulário */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="dono@barbearia.com"
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

            {error && (
              <p className="text-red-400 text-sm font-sans text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-2"
            >
              {isPending ? 'Entrando…' : 'Entrar'}
            </button>

          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 font-sans">
          Barbeiro? Acesse pelo link que o dono te enviou.
        </p>

      </div>
    </main>
  )
}
