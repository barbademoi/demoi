'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { entrar } from './actions'

interface Props {
  msg?: string
}

const MENSAGENS: Record<string, { titulo: string; texto: string; tom: 'aviso' | 'sucesso' }> = {
  ja_tem_senha: {
    titulo: 'Você já criou sua senha',
    texto: 'Use o email da compra e a senha que você definiu.',
    tom: 'aviso',
  },
  conta_suspensa: {
    titulo: 'Conta suspensa',
    texto:
      'Sua compra foi cancelada ou estornada e o acesso foi desativado. Fale com o suporte se for engano.',
    tom: 'aviso',
  },
  hotmart_cliente: {
    titulo: 'Acesse sua conta',
    texto:
      'Use o email da sua compra. Se ainda não criou senha, clique em "Esqueci minha senha" pra gerar uma nova.',
    tom: 'aviso',
  },
  senha_trocada: {
    titulo: 'Senha criada com sucesso',
    texto: 'Agora entre com sua nova senha pra acessar a Bússola.',
    tom: 'sucesso',
  },
}

export function EntrarForm({ msg }: Props) {
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

  const m = msg ? MENSAGENS[msg] : null

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-16 w-auto mb-2" />
          <p className="text-chumbo text-sm">Acesso do gestor</p>
        </div>

        {m && (
          <div
            className={[
              'mb-5 rounded-md border p-4 text-sm',
              m.tom === 'sucesso'
                ? 'border-verde-musgo/30 bg-verde-musgo/10'
                : 'border-marrom/20 bg-linho/60',
            ].join(' ')}
          >
            <p className="font-semibold text-text">{m.titulo}</p>
            <p className="text-grafite mt-1 leading-relaxed">{m.texto}</p>
          </div>
        )}

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

            {error && <p className="text-vinho text-sm text-center">{error}</p>}

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
