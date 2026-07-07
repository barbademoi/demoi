'use client'

import { useState, useTransition } from 'react'
import { trocarSenhaObrigatoria } from './actions'

export default function RedefinirSenhaObrigatoriaPage() {
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await trocarSenhaObrigatoria(formData)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <main className="bm-theme min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text mb-2">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
        </div>

        <div className="card p-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl text-text mb-1">Crie sua senha</h2>
            <p className="text-text-muted text-sm font-sans leading-relaxed">
              Por segurança, defina uma senha pessoal antes de continuar.
              A senha temporária enviada por email não poderá ser usada novamente.
            </p>
          </div>

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
              <label htmlFor="confirmacao" className="label">Confirmar senha</label>
              <input
                id="confirmacao"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Repita a senha"
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
              {isPending ? 'Salvando…' : 'Definir senha e entrar'}
            </button>

          </form>
        </div>

      </div>
    </main>
  )
}
