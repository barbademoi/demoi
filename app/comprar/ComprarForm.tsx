'use client'

import { useState, useTransition } from 'react'
import { iniciarCompra } from './actions'

interface Props {
  erro?: string
}

export default function ComprarForm({ erro: erroInicial }: Props) {
  const [erro, setErro] = useState<string | null>(erroInicial ?? null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await iniciarCompra(null, formData)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="label">Nome completo *</label>
        <input
          id="nome" name="nome" type="text"
          required minLength={2} autoComplete="name"
          placeholder="Carlos Henrique"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="email" className="label">Email *</label>
        <input
          id="email" name="email" type="email"
          required autoComplete="email"
          placeholder="carlos@barbearia.com"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="telefone" className="label">
          WhatsApp <span className="text-text-muted font-normal">(opcional)</span>
        </label>
        <input
          id="telefone" name="telefone" type="tel"
          autoComplete="tel"
          placeholder="(35) 99999-9999"
          className="input"
        />
      </div>

      {erro && (
        <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full text-base py-4 mt-2"
      >
        {isPending ? 'Redirecionando…' : 'Pagar — R$ 47,00 →'}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-text-muted font-sans pt-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Pagamento 100% seguro via Mercado Pago</span>
      </div>
    </form>
  )
}
