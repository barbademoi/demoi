'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { entrar } from './actions'

function Botao() {
  const { pending } = useFormStatus()
  return (
    <button className="btn-primario w-full sm:w-full" disabled={pending}>
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  )
}

export default function FormEntrar({ next }: { next: string }) {
  const [erro, acao] = useFormState(entrar, null)
  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="rotulo">E-mail</label>
        <input id="email" name="email" type="email" className="campo" autoComplete="email" autoCapitalize="none" required />
      </div>
      <div>
        <label htmlFor="senha" className="rotulo">Senha</label>
        <input id="senha" name="senha" type="password" className="campo" autoComplete="current-password" required />
      </div>
      {erro && <p className="rounded-xl bg-perigo/10 p-4 text-perigo">{erro}</p>}
      <Botao />
    </form>
  )
}
