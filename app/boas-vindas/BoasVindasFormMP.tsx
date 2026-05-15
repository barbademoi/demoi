'use client'

import { useState, useTransition } from 'react'
import { definirSenhaMP } from './actions'

interface Props {
  externalReference: string
}

export default function BoasVindasFormMP({ externalReference }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await definirSenhaMP(null, formData)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="external_reference" value={externalReference} />

      <div>
        <label htmlFor="nova_senha_mp" className="label">Nova senha</label>
        <input
          id="nova_senha_mp" name="nova_senha"
          type="password" autoComplete="new-password"
          required minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="confirmar_senha_mp" className="label">Confirmar senha</label>
        <input
          id="confirmar_senha_mp" name="confirmar_senha"
          type="password" autoComplete="new-password"
          required minLength={8}
          placeholder="Repita a senha"
          className="input"
        />
      </div>

      {erro && (
        <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
        {isPending ? 'Criando conta…' : 'Criar conta e entrar →'}
      </button>
    </form>
  )
}
