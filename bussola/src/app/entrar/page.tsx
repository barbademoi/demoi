'use client'

import { Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { entrar } from './actions'

// Banner de aviso vindo de outros fluxos (Hotmart, refund, etc).
function MsgBanner() {
  const params = useSearchParams()
  const msg = params.get('msg')
  if (!msg) return null

  const conteudo: Record<string, { titulo: string; texto: string }> = {
    ja_tem_senha: {
      titulo: 'Você já tem conta',
      texto: 'Sua senha já foi criada. Entre com email e senha abaixo.',
    },
    conta_suspensa: {
      titulo: 'Conta suspensa',
      texto:
        'Sua compra foi cancelada ou estornada e o acesso foi desativado. Fale com o suporte se for engano.',
    },
    hotmart_cliente: {
      titulo: 'Acesse sua conta',
      texto:
        'Use o email da sua compra. Se ainda não criou senha, clique em "Esqueci minha senha" pra receber um link.',
    },
  }
  const m = conteudo[msg]
  if (!m) return null

  return (
    <div className="mb-5 rounded-md border border-marrom/20 bg-linho/60 p-4 text-sm">
      <p className="font-semibold text-text">{m.titulo}</p>
      <p className="text-grafite mt-1 leading-relaxed">{m.texto}</p>
    </div>
  )
}

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
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-16 w-auto mb-2" />
          <p className="text-chumbo text-sm">Acesso do gestor</p>
        </div>

        <Suspense fallback={null}>
          <MsgBanner />
        </Suspense>

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
