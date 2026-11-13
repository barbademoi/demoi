'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Avatar, Erro, Modal, Rotulo, Titulo, Vazio } from '@/components/tarefix/ui'
import { criarColaborador } from './acoes'
import { DICAS } from '@/components/tarefix/dicas'

type Item = { id: string; nome: string; foto_url: string | null; funcao_id: string | null; ativo: boolean }
type FuncaoItem = { id: string; nome: string; ativo: boolean }

export function ListaColaboradores({ colaboradores, funcoes }: { colaboradores: Item[]; funcoes: FuncaoItem[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [funcaoId, setFuncaoId] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const nomeFuncao = Object.fromEntries(funcoes.map((f) => [f.id, f.nome]))

  function abrir() {
    setNome('')
    setFuncaoId(funcoes.find((f) => f.ativo)?.id ?? '')
    setPin('')
    setErro(null)
    setAberto(true)
  }

  const botaoNovo = (
    <button type="button" className="tf-botao" onClick={abrir}>
      + Novo
    </button>
  )

  return (
    <>
      <Titulo acao={colaboradores.length > 0 ? botaoNovo : undefined}>Equipe</Titulo>

      {colaboradores.length === 0 ? (
        <Vazio titulo="Ninguém cadastrado ainda" texto="Cadastre cada colaborador com nome, função e um PIN de 4 números." acao={botaoNovo} />
      ) : (
        <ul className="tf-cartao divide-y divide-tf-borda">
          {colaboradores.map((c) => (
            <li key={c.id}>
              <Link href={`/tarefix/painel/colaboradores/${c.id}`} className={`flex min-h-[72px] items-center gap-4 px-5 py-3 hover:bg-tf-marca-clara/50 ${c.ativo ? '' : 'opacity-50'}`}>
                <Avatar nome={c.nome} url={c.foto_url} />
                <span className="flex-1">
                  <span className="block font-bold">{c.nome}</span>
                  <span className="block text-sm text-tf-suave">
                    {(c.funcao_id && nomeFuncao[c.funcao_id]) || 'Sem função'}
                    {!c.ativo && ' · desativado'}
                  </span>
                </span>
                <span className="text-xl text-tf-suave" aria-hidden>›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo="Novo colaborador">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setErro(null)
            iniciar(async () => {
              const r = await criarColaborador({ nome, funcao_id: funcaoId || null, pin })
              if (!r.ok) return setErro(r.erro)
              router.push(`/tarefix/painel/colaboradores/${r.id}?novo=1`)
            })
          }}
        >
          <div>
            <label className="tf-rotulo" htmlFor="c-nome">Nome</label>
            <input id="c-nome" className="tf-campo" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Rotulo htmlFor="c-funcao" {...DICAS.funcao}>Função</Rotulo>
            <select id="c-funcao" className="tf-campo" value={funcaoId} onChange={(e) => setFuncaoId(e.target.value)}>
              <option value="">Sem função</option>
              {funcoes
                .filter((f) => f.ativo)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Rotulo htmlFor="c-pin" {...DICAS.pin}>PIN de acesso (4 números)</Rotulo>
            <input
              id="c-pin"
              className="tf-campo text-center text-2xl tracking-[0.5em]"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
            />
            <p className="mt-1 text-sm text-tf-suave">Você passa o PIN pessoalmente. Ele não aparece de novo depois.</p>
          </div>
          <Erro texto={erro} />
          <button type="submit" className="tf-botao w-full" disabled={pendente}>
            {pendente ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>
      </Modal>
    </>
  )
}
