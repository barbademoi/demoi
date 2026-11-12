'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { criarDono, type RespostaCriarDono } from './acoes'

function Enviar() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="tf-botao w-full" disabled={pending}>
      {pending ? 'Criando…' : 'Criar minha conta'}
    </button>
  )
}

export function FormDono() {
  const [estado, acao] = useFormState<RespostaCriarDono, FormData>(criarDono, { erro: null })
  return (
    <form action={acao} className="space-y-3">
      <div>
        <label className="tf-rotulo" htmlFor="empresa">Nome da empresa</label>
        <input id="empresa" name="empresa" className="tf-campo" defaultValue="Demôi" required />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="nome">Seu nome</label>
        <input id="nome" name="nome" className="tf-campo" autoComplete="name" required />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="email">Seu e-mail (pode ser o mesmo do BarberMeta)</label>
        <input id="email" name="email" type="email" className="tf-campo" autoComplete="email" required />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="senha">Senha (mín. 8 caracteres · se o e-mail já tem conta, a mesma senha dela)</label>
        <input id="senha" name="senha" type="password" minLength={8} className="tf-campo" autoComplete="new-password" required />
      </div>
      {estado.erro && <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm font-bold">{estado.erro}</p>}
      <Enviar />
    </form>
  )
}
