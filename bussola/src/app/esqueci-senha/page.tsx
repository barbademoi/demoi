'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { solicitarReset } from './actions'

export default function EsqueciSenhaPage() {
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await solicitarReset(formData)
      if (result?.error) setError(result.error)
      else setEnviado(true)
    })
  }

  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-primary mb-3">Verifique seu email</h1>
          <p className="text-text-muted">
            Se houver uma conta com esse email, enviamos um link para redefinir a senha.
          </p>
          <Link href="/entrar" className="btn-primary w-full mt-8">
            Voltar para o login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">Esqueci minha senha</h1>
          <p className="text-text-muted text-sm">
            Informe seu email e enviaremos um link para redefinir.
          </p>
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

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          <Link href="/entrar" className="text-primary font-medium hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  )
}
