'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Erro, Modal, Vazio, useAcao, useAviso } from '@/components/tarefix/ui'
import { criarMentorado } from './acoes'
import { EditorMissao } from './EditorMissao'

export type CartaoMentorado = {
  id: string
  nome: string
  ativo: boolean
  prazo: { total: number; ok: number; percentual: number | null }
  atrasadas: number
  aguardando: number
  reuniao: string | null
}

const quandoBR = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export function ListaMentoria({ cartoes, hoje }: { cartoes: CartaoMentorado[]; hoje: string }) {
  const router = useRouter()
  const [novo, setNovo] = useState(false)
  const [missao, setMissao] = useState(false)
  const [f, setF] = useState({ nome: '', whatsapp: '' })
  const acao = useAcao()
  const aviso = useAviso()
  const ativos = cartoes.filter((c) => c.ativo)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="tf-botao" onClick={() => (setF({ nome: '', whatsapp: '' }), setNovo(true))}>
          + Mentorado
        </button>
        <button type="button" className="tf-botao2" disabled={ativos.length === 0} onClick={() => setMissao(true)}>
          + Missão
        </button>
      </div>
      <Link href="/tarefix/painel/mentoria/missoes" className="tf-cartao flex items-center gap-3 p-4 hover:bg-tf-marca-clara/40">
        <span className="text-2xl" aria-hidden>
          📚
        </span>
        <span className="flex-1">
          <span className="block font-extrabold">Biblioteca de missões</span>
          <span className="block text-sm text-tf-suave">Todas as missões criadas: editar, vincular a outros mentorados e duplicar.</span>
        </span>
        <span className="text-xl text-tf-suave" aria-hidden>
          ›
        </span>
      </Link>

      {cartoes.length === 0 ? (
        <Vazio titulo="Nenhum mentorado ainda" texto="Cadastre o primeiro: ele recebe um link com as missões e a próxima reunião." />
      ) : (
        <ul className="space-y-3">
          {cartoes.map((c) => (
            <li key={c.id}>
              <Link href={`/tarefix/painel/mentoria/${c.id}`} className={`tf-cartao block p-4 hover:bg-tf-marca-clara/40 ${c.ativo ? '' : 'opacity-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold">{c.nome}</p>
                    <p className="text-sm text-tf-suave">
                      {!c.ativo
                        ? 'pausado'
                        : c.prazo.total
                          ? `${c.prazo.ok} de ${c.prazo.total} entregas no prazo`
                          : 'nenhuma entrega vencida ainda'}
                    </p>
                  </div>
                  {c.prazo.percentual !== null && c.ativo && <span className="shrink-0 text-2xl font-black tabular-nums">{c.prazo.percentual}%</span>}
                </div>
                {c.ativo && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    {c.atrasadas > 0 && <span className="rounded-full bg-tf-texto px-2 py-1 text-tf-fundo">{c.atrasadas} atrasada{c.atrasadas > 1 ? 's' : ''}</span>}
                    {c.aguardando > 0 && <span className="rounded-full bg-tf-marca px-2 py-1 text-white">{c.aguardando} para aprovar</span>}
                    <span className="rounded-full bg-tf-marca-clara px-2 py-1 text-tf-marca-texto">{c.reuniao ? `📅 ${quandoBR(c.reuniao)}` : 'sem reunião marcada'}</span>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={novo} aoFechar={() => !acao.pendente && setNovo(false)} titulo="Novo mentorado">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            acao.rodar(async () => {
              const r = await criarMentorado(f)
              if (r.ok) router.push(`/tarefix/painel/mentoria/${r.id}?novo=1`)
              return r
            })
          }}
        >
          <div>
            <label className="tf-rotulo" htmlFor="mt-nome">Nome</label>
            <input id="mt-nome" className="tf-campo" autoFocus value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Leozin Barbeiro" />
          </div>
          <div>
            <label className="tf-rotulo" htmlFor="mt-zap">WhatsApp (opcional)</label>
            <input id="mt-zap" className="tf-campo" inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="Ex.: 11 98765-4321" />
            <p className="mt-1 text-sm text-tf-suave">Para mandar o link e as cobranças direto para ele.</p>
          </div>
          <Erro texto={acao.erro} />
          <button type="submit" className="tf-botao w-full" disabled={acao.pendente || !f.nome.trim()}>
            {acao.pendente ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>
      </Modal>

      {missao && (
        <EditorMissao
          aberto
          hoje={hoje}
          mentorados={ativos.map((c) => ({ id: c.id, nome: c.nome }))}
          aoFechar={() => setMissao(false)}
          aoSalvar={() => {
            setMissao(false)
            aviso.mostrar('Missão criada')
            router.refresh()
          }}
        />
      )}
      {aviso.elemento}
    </div>
  )
}
