'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Copy, CheckCircle2 } from 'lucide-react'
import { entrar } from './actions'

interface Props {
  email: string
  senhaTemporaria: string
}

// Tela /entrar quando vindo do redirect Hotmart com params válidos.
// Mostra banner verde com email + senha temp pré-preenchidos e botão
// "Entrar" pronto. Botão "Copiar" facilita pra mobile.
export function PreFilledForm({ email, senhaTemporaria }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const copiarSenha = async () => {
    try {
      await navigator.clipboard.writeText(senhaTemporaria)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* clipboard pode falhar em http; ignora */
    }
  }

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
    <main className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-14 w-auto" />
        </div>

        {/* BANNER VERDE — sucesso pós-compra */}
        <div className="rounded-lg border-l-4 border-verde-musgo bg-verde-musgo/10 p-5 mb-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} strokeWidth={2} className="text-verde-musgo shrink-0" />
            <h2 className="font-semibold text-text">Compra confirmada!</h2>
          </div>
          <p className="text-sm text-grafite leading-relaxed">
            Use os dados abaixo pra entrar pela primeira vez. Logo depois você
            vai criar sua senha definitiva.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <p className="text-xs text-chumbo uppercase tracking-wider font-semibold mb-1">
                Email
              </p>
              <p className="text-sm text-text font-mono break-all">{email}</p>
            </div>

            <div>
              <p className="text-xs text-chumbo uppercase tracking-wider font-semibold mb-1">
                Senha temporária
              </p>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-md bg-white border border-border font-mono text-lg tracking-wider text-text select-all">
                  {senhaTemporaria}
                </code>
                <button
                  type="button"
                  onClick={copiarSenha}
                  className="px-3 rounded-md border border-marrom/30 bg-white hover:bg-linho transition-colors text-marrom inline-flex items-center gap-1.5 text-sm font-medium"
                  aria-label="Copiar senha"
                >
                  {copiado ? (
                    <>
                      <Check size={14} strokeWidth={2.5} />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} strokeWidth={2} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FORM PRÉ-PREENCHIDO */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={email}
                readOnly
                className="input bg-linho/40 text-grafite"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Senha temporária</label>
              <input
                id="password"
                name="password"
                type="text"
                autoComplete="off"
                required
                defaultValue={senhaTemporaria}
                className="input font-mono"
              />
            </div>

            {error && <p className="text-vinho text-sm text-center">{error}</p>}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Entrando…' : 'Entrar na Bússola'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-chumbo mt-4">
          Problema?{' '}
          <Link href="/esqueci-senha" className="text-marrom underline">
            Gerar nova senha temporária
          </Link>
        </p>
      </div>
    </main>
  )
}
