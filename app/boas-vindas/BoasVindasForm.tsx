'use client'

import { useTransition, useState } from 'react'
import { definirSenha } from './actions'

interface Props {
  email: string
  hotmartTransaction: string
}

export default function BoasVindasForm({ email, hotmartTransaction }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await definirSenha(null, formData)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="hotmart_transaction" value={hotmartTransaction} />

      <div>
        <label htmlFor="nova_senha" className="label">Nova senha</label>
        <input
          id="nova_senha"
          name="nova_senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="confirmar_senha" className="label">Confirmar senha</label>
        <input
          id="confirmar_senha"
          name="confirmar_senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
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
        {isPending ? 'Criando conta…' : 'Criar conta e entrar →'}
      </button>
    </form>
  )
}
