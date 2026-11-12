'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarDono, type RespostaCriarDono } from './acoes'

function Enviar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="botao w-full" disabled={pending}>
      {pending ? 'Criando…' : 'Criar minha conta'}
    </button>
  )
}

export function FormDono() {
  const [estado, acao] = useFormState<RespostaCriarDono, FormData>(criarDono, { erro: null })
  return (
    <form action={acao} className="space-y-3">
      <div>
        <label className="rotulo" htmlFor="empresa">Nome da empresa</label>
        <input id="empresa" name="empresa" className="campo" defaultValue="Demôi" required />
      </div>
      <div>
        <label className="rotulo" htmlFor="nome">Seu nome</label>
        <input id="nome" name="nome" className="campo" autoComplete="name" required />
      </div>
      <div>
        <label className="rotulo" htmlFor="email">Seu e-mail (para entrar)</label>
        <input id="email" name="email" type="email" className="campo" autoComplete="email" required />
      </div>
      <div>
        <label className="rotulo" htmlFor="senha">Senha (mín. 8 caracteres)</label>
        <input id="senha" name="senha" type="password" minLength={8} className="campo" autoComplete="new-password" required />
      </div>
      {estado.erro && <p className="rounded-xl bg-marca-clara px-4 py-3 text-sm font-bold">{estado.erro}</p>}
      <Enviar />
    </form>
  )
}
