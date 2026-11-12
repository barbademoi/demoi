'use client'

import { useState } from 'react'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { Erro } from '@/components/tarefix/ui'

export function FormEntrar({ semAcesso }: { semAcesso: boolean }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(
    semAcesso ? 'Esta conta não tem acesso ao Tarefix. Entre com a conta de dono.' : null
  )
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)
    const supabase = createTarefixClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setCarregando(false)
      setErro(/invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message)
      return
    }
    // navegação completa para o servidor ler os cookies novos
    window.location.href = '/tarefix/painel'
  }

  return (
    <form onSubmit={entrar} className="tf-cartao space-y-4 p-5">
      <div>
        <label className="tf-rotulo" htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" required className="tf-campo" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="current-password" required className="tf-campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </div>
      <Erro texto={erro} />
      <button type="submit" disabled={carregando} className="tf-botao w-full">
        {carregando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
