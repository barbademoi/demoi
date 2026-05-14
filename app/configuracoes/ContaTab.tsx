'use client'

import { useState, useTransition } from 'react'
import { trocarSenha } from './senha/actions'

export default function ContaTab({ email }: { email: string }) {
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null); setSucesso(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await trocarSenha(formData)
      if (result?.error) setErro(result.error)
      else { setSucesso(true); (e.target as HTMLFormElement).reset() }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label">Email da conta</p>
        <p className="text-text text-sm font-sans bg-surface-2 border border-border rounded-xl px-4 py-3">{email}</p>
      </div>

      <hr className="border-border" />

      <div>
        <p className="font-sans text-sm font-semibold text-text mb-4">Alterar senha</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="senha" className="label">Nova senha</label>
            <input id="senha" name="senha" type="password" autoComplete="new-password"
              required minLength={6} placeholder="Mínimo 6 caracteres" className="input" />
          </div>
          <div>
            <label htmlFor="confirmacao" className="label">Confirmar nova senha</label>
            <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password"
              required minLength={6} placeholder="Repita a senha" className="input" />
          </div>
          {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
          {sucesso && <p className="text-green-400 text-sm font-sans">Senha alterada com sucesso!</p>}
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
