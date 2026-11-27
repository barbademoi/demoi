'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import Marca from '@/components/Marca'
import { pedirLink } from './actions'

function Botao() {
  const { pending } = useFormStatus()
  return (
    <button className="btn-primario w-full sm:w-full" disabled={pending}>
      {pending ? 'Enviando...' : 'Mandar link pro meu e-mail'}
    </button>
  )
}

export default function EsqueciSenha() {
  const [r, acao] = useFormState(pedirLink, null)
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-12 pt-6">
      <Marca />
      <div className="flex flex-1 flex-col justify-center py-10">
        <h1 className="mb-2 text-3xl font-black">Esqueci minha senha</h1>
        {r === 'ok' ? (
          <p className="mt-4 rounded-xl bg-ok/10 p-4 text-ok">
            Se esse e-mail estiver cadastrado, chega um link em instantes. Olha também a caixa de spam.
          </p>
        ) : (
          <>
            <p className="mb-8 text-suave">A gente manda um link pra você criar uma senha nova.</p>
            <form action={acao} className="space-y-5">
              <div>
                <label htmlFor="email" className="rotulo">E-mail</label>
                <input id="email" name="email" type="email" className="campo" autoComplete="email" required />
              </div>
              {r?.startsWith('erro:') && <p className="erro">{r.slice(5)}</p>}
              <Botao />
            </form>
          </>
        )}
        <Link href="/entrar" className="mt-6 text-center text-latao">Voltar para entrar</Link>
      </div>
    </main>
  )
}
