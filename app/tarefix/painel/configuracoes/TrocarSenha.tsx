'use client'

import { useState, useTransition } from 'react'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { Erro, useAviso } from '@/components/tarefix/ui'

/** Troca a senha da conta (a mesma do BarberMeta). */
export function TrocarSenha() {
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const aviso = useAviso()

  if (!aberto)
    return (
      <>
        <button type="button" className="tf-botao2 w-full" onClick={() => setAberto(true)}>
          Trocar senha
        </button>
        {aviso.elemento}
      </>
    )

  return (
    <form
      className="space-y-3"
      onSubmit={(ev) => {
        ev.preventDefault()
        setErro(null)
        if (senha.length < 8) return setErro('A senha precisa de pelo menos 8 caracteres.')
        if (senha !== repetir) return setErro('As duas senhas não são iguais.')
        iniciar(async () => {
          const { error } = await createTarefixClient().auth.updateUser({ password: senha })
          if (error) return setErro(error.message)
          setSenha('')
          setRepetir('')
          setAberto(false)
          aviso.mostrar('Senha trocada')
        })
      }}
    >
      <div>
        <label className="tf-rotulo" htmlFor="nova-senha">Nova senha</label>
        <input id="nova-senha" type="password" autoComplete="new-password" className="tf-campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="repetir-senha">Repita a nova senha</label>
        <input id="repetir-senha" type="password" autoComplete="new-password" className="tf-campo" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
      </div>
      <p className="text-sm text-tf-suave">Vale também para entrar no BarberMeta.</p>
      <Erro texto={erro} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="tf-botao2" onClick={() => setAberto(false)} disabled={pendente}>
          Cancelar
        </button>
        <button type="submit" className="tf-botao" disabled={pendente}>
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      {aviso.elemento}
    </form>
  )
}
