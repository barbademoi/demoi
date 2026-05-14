'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { trocarSenha } from './actions'

export default function TrocarSenhaPage() {
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(false)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await trocarSenha(formData)
      if (result?.error) {
        setErro(result.error)
      } else {
        setSucesso(true)
        ;(e.target as HTMLFormElement).reset()
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
            Alterar senha
          </p>
        </div>

        <div className="card p-8">
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
              <label htmlFor="confirmacao" className="label">Confirmar nova senha</label>
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

            {sucesso && (
              <p className="text-green-400 text-sm font-sans text-center">
                Senha alterada com sucesso!
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-2"
            >
              {isPending ? 'Salvando…' : 'Salvar nova senha'}
            </button>

          </form>
        </div>

        <p className="text-center mt-6">
          <Link href="/dashboard" className="text-text-muted hover:text-text text-sm font-sans transition-colors">
            ← Voltar ao dashboard
          </Link>
        </p>

      </div>
    </main>
  )
}
