'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { Erro } from '@/components/tarefix/ui'
import type { Uso } from '@/lib/tarefix/cadastro'
import { criarConta, criarMeuTarefix } from './acoes'

/** Escolha "Só para mim" / "Com minha equipe". */
function EscolhaUso({ uso, aoMudar }: { uso: Uso; aoMudar: (u: Uso) => void }) {
  return (
    <div>
      <span className="tf-rotulo">Como você vai usar?</span>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['pessoal', 'Só para mim', 'Minhas tarefas do dia, com lembretes'],
            ['equipe', 'Com minha equipe', 'Checklist diário de cada colaborador'],
          ] as const
        ).map(([v, t, d]) => (
          <button
            key={v}
            type="button"
            aria-pressed={uso === v}
            onClick={() => aoMudar(v)}
            className={`rounded-2xl border p-3 text-left transition ${uso === v ? 'border-tf-marca bg-tf-marca-clara' : 'border-tf-borda'}`}
          >
            <span className="block font-extrabold">{t}</span>
            <span className="mt-0.5 block text-xs text-tf-suave">{d}</span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-tf-suave">Dá para mudar depois: quem usa sozinho pode cadastrar a equipe quando quiser.</p>
    </div>
  )
}

export function FormCriarConta() {
  const [f, setF] = useState({ nome: '', email: '', senha: '', empresa: '', site: '' })
  const [uso, setUso] = useState<Uso>('pessoal')
  const [erro, setErro] = useState<string | null>(null)
  const [jaTem, setJaTem] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setJaTem(false)
    setCarregando(true)
    try {
      const r = await criarConta({ ...f, uso })
      if (!r.ok) {
        setErro(r.erro)
        setJaTem(Boolean(r.jaTemConta))
        return
      }
      const { error } = await createTarefixClient().auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.senha })
      if (error) {
        setErro('Conta criada! Agora entre com o seu e-mail e senha.')
        return
      }
      window.location.href = r.destino
    } catch {
      setErro('Sem conexão. Confira a internet e tente de novo.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="tf-cartao space-y-4 p-5">
      <EscolhaUso uso={uso} aoMudar={setUso} />
      <div>
        <label className="tf-rotulo" htmlFor="cc-nome">Seu nome</label>
        <input id="cc-nome" className="tf-campo" autoComplete="name" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
      </div>
      {uso === 'equipe' && (
        <div>
          <label className="tf-rotulo" htmlFor="cc-empresa">Nome do negócio</label>
          <input id="cc-empresa" className="tf-campo" placeholder="Ex.: Barbearia do João" value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} />
        </div>
      )}
      <div>
        <label className="tf-rotulo" htmlFor="cc-email">E-mail</label>
        <input id="cc-email" type="email" autoComplete="email" required className="tf-campo" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="cc-senha">Senha (mínimo 8)</label>
        <input id="cc-senha" type="password" autoComplete="new-password" required minLength={8} className="tf-campo" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
      </div>
      {/* campo-isca: invisível para pessoas */}
      <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} name="site" />
      <Erro texto={erro} />
      {jaTem && (
        <Link href="/tarefix/entrar" className="tf-botao2 w-full">
          Entrar com essa conta
        </Link>
      )}
      <button type="submit" disabled={carregando} className="tf-botao w-full">
        {carregando ? 'Criando…' : 'Criar conta grátis'}
      </button>
    </form>
  )
}

/** Para quem já entrou com uma conta (ex.: BarberMeta) que ainda não tem Tarefix. */
export function FormCriarMeuTarefix() {
  const [uso, setUso] = useState<Uso>('pessoal')
  const [empresa, setEmpresa] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  return (
    <form
      className="tf-cartao w-full space-y-4 p-5 text-left"
      onSubmit={async (e) => {
        e.preventDefault()
        setErro(null)
        setCarregando(true)
        const r = await criarMeuTarefix({ empresa, uso })
        if (r.ok) window.location.href = r.destino
        else {
          setErro(r.erro)
          setCarregando(false)
        }
      }}
    >
      <EscolhaUso uso={uso} aoMudar={setUso} />
      {uso === 'equipe' && (
        <div>
          <label className="tf-rotulo" htmlFor="cm-empresa">Nome do negócio</label>
          <input id="cm-empresa" className="tf-campo" placeholder="Ex.: Barbearia do João" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
      )}
      <Erro texto={erro} />
      <button type="submit" disabled={carregando} className="tf-botao w-full">
        {carregando ? 'Criando…' : 'Criar meu Tarefix'}
      </button>
    </form>
  )
}
