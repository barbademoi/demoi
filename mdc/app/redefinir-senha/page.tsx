'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Marca from '@/components/Marca'
import { trocarSenha } from './actions'

function Botao() {
  const { pending } = useFormStatus()
  return (
    <button className="btn-primario w-full sm:w-full" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar senha nova'}
    </button>
  )
}

export default function RedefinirSenha() {
  const [erro, acao] = useFormState(trocarSenha, null)
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
      <Marca />
      <div className="flex flex-1 flex-col justify-center py-10">
        <h1 className="mb-8 text-3xl font-black">Crie sua senha nova</h1>
        <form action={acao} className="space-y-5">
          <div>
            <label htmlFor="senha" className="rotulo">Senha nova</label>
            <input id="senha" name="senha" type="password" className="campo" autoComplete="new-password" minLength={8} required />
            <p className="ajuda">Pelo menos 8 caracteres.</p>
          </div>
          <div>
            <label htmlFor="confirma" className="rotulo">Repita a senha</label>
            <input id="confirma" name="confirma" type="password" className="campo" autoComplete="new-password" required />
          </div>
          {erro && <p className="rounded-xl bg-perigo/10 p-4 text-perigo">{erro}</p>}
          <Botao />
        </form>
      </div>
    </main>
  )
}
