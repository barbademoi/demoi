'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { solicitarResetSenha } from './actions'

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await solicitarResetSenha(formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setEnviado(true)
      }
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text mb-2">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Recuperação de senha
          </p>
        </div>

        <div className="card p-8">
          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-text text-sm font-sans leading-relaxed">
                Se este email estiver cadastrado, você receberá um link de redefinição em instantes.
              </p>
              <p className="text-text-muted text-xs font-sans">
                Verifique sua caixa de entrada e a pasta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-text-muted text-sm font-sans leading-relaxed">
                Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
              </p>

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

              {erro && (
                <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full mt-2"
              >
                {isPending ? 'Enviando…' : 'Enviar link de redefinição'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-text-muted hover:text-text text-sm font-sans transition-colors">
            ← Voltar ao login
          </Link>
        </p>

      </div>
    </main>
  )
}
