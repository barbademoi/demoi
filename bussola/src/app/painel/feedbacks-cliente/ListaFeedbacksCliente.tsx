'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star,
  Gift,
  CheckCircle2,
  Archive,
  Share2,
  Pencil,
  Settings,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import { tempoRelativo, dataLonga } from '@/lib/feedbacks'
import {
  marcarLido,
  arquivar,
  toggleBrindeUsado,
  compartilharComColaborador,
  criarObservacaoInterna,
} from './actions'

export interface ColaboradorLite {
  id: string
  nome: string
  foto_url: string | null
}

// Supabase às vezes devolve relacionamentos como array; tratamos ambos.
type ProfRel = { nome: string; foto_url: string | null } | { nome: string; foto_url: string | null }[] | null
type BrindeRel = { nome: string } | { nome: string }[] | null

export interface FeedbackClienteUI {
  id: string
  profissional_id: string | null
  nome_cliente: string | null
  identificado: boolean
  estrelas: number
  comentario: string | null
  brinde_id: string | null
  codigo_resgate: string | null
  brinde_usado: boolean
  status: 'novo' | 'lido' | 'compartilhado_colaborador' | 'arquivado'
  created_at: string
  profissionais: ProfRel
  brindes: BrindeRel
}

function profOf(f: FeedbackClienteUI): { nome: string; foto_url: string | null } | null {
  const p = f.profissionais
  if (!p) return null
  if (Array.isArray(p)) return p[0] ?? null
  return p
}
function brindeOf(f: FeedbackClienteUI): { nome: string } | null {
  const b = f.brindes
  if (!b) return null
  if (Array.isArray(b)) return b[0] ?? null
  return b
}

interface Props {
  featureAtiva: boolean
  contadores: { novos: number; naSemana: number; noMes: number; media: number }
  lista: FeedbackClienteUI[]
  ativos: ColaboradorLite[]
}

type FiltroStatus = 'todos' | 'novo' | 'lido' | 'arquivado'
type FiltroPeriodo = 'tudo' | 'semana' | 'mes'

export default function ListaFeedbacksCliente({ featureAtiva, contadores, lista, ativos }: Props) {
  const router = useRouter()
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('tudo')
  const [filtroEstrelas, setFiltroEstrelas] = useState<Set<number>>(new Set())
  const [filtroComComentario, setFiltroComComentario] = useState(false)
  const [filtroColabId, setFiltroColabId] = useState<string>('todos')
  const [filtroComBrinde, setFiltroComBrinde] = useState(false)

  function dentroPeriodo(iso: string): boolean {
    if (filtroPeriodo === 'tudo') return true
    const t = new Date(iso).getTime()
    const agora = Date.now()
    const ms = filtroPeriodo === 'semana' ? 7 * 24 * 60 * 60 * 1000 : 31 * 24 * 60 * 60 * 1000
    return t >= agora - ms
  }

  const lista2 = useMemo(() => {
    return lista.filter((f) => {
      if (filtroStatus !== 'todos' && f.status !== filtroStatus) return false
      if (filtroEstrelas.size > 0 && !filtroEstrelas.has(f.estrelas)) return false
      if (filtroComComentario && !f.comentario) return false
      if (filtroComBrinde && !f.brinde_id) return false
      if (filtroColabId !== 'todos' && f.profissional_id !== filtroColabId) return false
      if (!dentroPeriodo(f.created_at)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, filtroStatus, filtroPeriodo, filtroEstrelas, filtroComComentario, filtroColabId, filtroComBrinde])

  const pillCls = (on: boolean) =>
    [
      'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
      on ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-grafite',
    ].join(' ')

  if (!featureAtiva) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
        <h1 className="text-xl font-semibold text-text mb-2">Feedbacks dos clientes</h1>
        <div className="card p-6 text-center text-sm text-grafite">
          <p>Você ainda não ativou a coleta de feedback de cliente.</p>
          <Link href="/painel/configuracoes" className="inline-flex items-center gap-1 text-marrom font-medium mt-3">
            <Settings size={14} strokeWidth={1.5} /> Ativar nas Configurações
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text">Feedbacks dos clientes</h1>
      </div>

      {/* CONTADORES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="card p-3">
          <p className="text-xs text-chumbo">Novos</p>
          <p className={`text-2xl font-semibold ${contadores.novos > 0 ? 'text-marrom' : 'text-text'}`}>{contadores.novos}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-chumbo">Esta semana</p>
          <p className="text-2xl font-semibold text-text">{contadores.naSemana}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-chumbo">Este mês</p>
          <p className="text-2xl font-semibold text-text">{contadores.noMes}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-chumbo">Média</p>
          <p className="text-2xl font-semibold text-text inline-flex items-center gap-1">
            {contadores.media.toFixed(1)}
            <Star size={16} strokeWidth={1.5} fill="#8B6F47" color="#8B6F47" />
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(['todos', 'novo', 'lido', 'arquivado'] as FiltroStatus[]).map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)} className={pillCls(filtroStatus === s)}>
              {s === 'todos' ? 'Todos' : s === 'novo' ? 'Novos' : s === 'lido' ? 'Lidos' : 'Arquivados'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['tudo', 'semana', 'mes'] as FiltroPeriodo[]).map((p) => (
            <button key={p} type="button" onClick={() => setFiltroPeriodo(p)} className={pillCls(filtroPeriodo === p)}>
              {p === 'tudo' ? 'Tudo' : p === 'semana' ? 'Esta semana' : 'Este mês'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-chumbo">Estrelas:</span>
          {[1, 2, 3, 4, 5].map((n) => {
            const on = filtroEstrelas.has(n)
            return (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setFiltroEstrelas((prev) => {
                    const x = new Set(prev)
                    if (x.has(n)) x.delete(n)
                    else x.add(n)
                    return x
                  })
                }
                className={pillCls(on)}
              >
                {n}★
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="inline-flex items-center gap-1 text-xs text-grafite">
            <input
              type="checkbox"
              checked={filtroComComentario}
              onChange={(e) => setFiltroComComentario(e.target.checked)}
              className="accent-marrom w-4 h-4"
            />
            Com comentário
          </label>
          <label className="inline-flex items-center gap-1 text-xs text-grafite">
            <input
              type="checkbox"
              checked={filtroComBrinde}
              onChange={(e) => setFiltroComBrinde(e.target.checked)}
              className="accent-marrom w-4 h-4"
            />
            Com brinde
          </label>
          <select
            value={filtroColabId}
            onChange={(e) => setFiltroColabId(e.target.value)}
            className="text-xs rounded-md border border-border bg-white px-2 py-1.5 text-text"
          >
            <option value="todos">Todos colaboradores</option>
            {ativos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTA */}
      {lista2.length === 0 ? (
        <p className="text-chumbo text-sm text-center py-10">Nenhum feedback nesse filtro.</p>
      ) : (
        <div className="space-y-3">
          {lista2.map((f) => (
            <CardFeedback key={f.id} fb={f} ativos={ativos} onChange={() => router.refresh()} />
          ))}
        </div>
      )}
    </main>
  )
}

function CardFeedback({
  fb,
  ativos,
  onChange,
}: {
  fb: FeedbackClienteUI
  ativos: ColaboradorLite[]
  onChange: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [modal, setModal] = useState<null | 'compartilhar' | 'observacao'>(null)
  const [textoObs, setTextoObs] = useState('')
  const [escopoObs, setEscopoObs] = useState<'individual' | 'equipe'>('individual')
  const [profObs, setProfObs] = useState<string>(fb.profissional_id ?? '')

  const prof = profOf(fb)
  const brinde = brindeOf(fb)
  const profNome = prof?.nome ?? null

  function abrirObservacaoInterna() {
    setTextoObs(fb.comentario ? `Cliente comentou: ${fb.comentario}` : '')
    setEscopoObs(fb.profissional_id ? 'individual' : 'equipe')
    setProfObs(fb.profissional_id ?? '')
    setModal('observacao')
  }

  function exec(fn: () => Promise<{ error?: string; ok?: true } | undefined>) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) alert(res.error)
      else onChange()
    })
  }

  return (
    <div className="card p-4">
      {/* TOPO */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={20}
              strokeWidth={1.5}
              color="#8B6F47"
              fill={n <= fb.estrelas ? '#8B6F47' : 'transparent'}
            />
          ))}
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-chumbo">
          <span>{tempoRelativo(fb.created_at)}</span>
          {fb.status === 'novo' && (
            <span className="bg-marrom text-white rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Novo</span>
          )}
        </div>
      </div>

      {/* IDENTIFICAÇÃO */}
      <div className="mt-2 text-sm text-text">
        {fb.identificado && fb.nome_cliente ? (
          <span className="font-medium">{fb.nome_cliente}</span>
        ) : (
          <span className="italic text-chumbo">Cliente anônimo</span>
        )}
      </div>

      {/* COLABORADOR */}
      {prof && (
        <div className="mt-2 flex items-center gap-2">
          <Avatar nome={profNome ?? '—'} fotoUrl={prof.foto_url} size={24} />
          <span className="text-xs text-grafite">Atendido por <span className="font-medium text-text">{profNome}</span></span>
        </div>
      )}

      {/* COMENTÁRIO */}
      {fb.comentario && (
        <p className="mt-2 text-sm text-text whitespace-pre-wrap border-l-2 border-border pl-3">
          {fb.comentario}
        </p>
      )}

      {/* BRINDE */}
      {fb.brinde_id && (
        <div className="mt-3 rounded-md border border-border bg-linho p-3 text-sm">
          <p className="inline-flex items-center gap-1.5 text-marrom font-medium">
            <Gift size={14} strokeWidth={1.5} /> Brinde sorteado: {brinde?.nome ?? '—'}
          </p>
          {fb.codigo_resgate && (
            <p className="text-xs text-chumbo mt-1">
              Código: <span className="font-mono font-semibold text-text">{fb.codigo_resgate}</span>
            </p>
          )}
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-grafite">
            <input
              type="checkbox"
              checked={fb.brinde_usado}
              onChange={(e) => exec(() => toggleBrindeUsado(fb.id, e.target.checked))}
              disabled={isPending}
              className="accent-marrom w-4 h-4"
            />
            Brinde usado
          </label>
        </div>
      )}

      {/* AÇÕES */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {fb.profissional_id && fb.comentario && fb.status !== 'compartilhado_colaborador' && (
          <button
            type="button"
            onClick={() => setModal('compartilhar')}
            className="inline-flex items-center gap-1 text-xs text-marrom font-medium"
            disabled={isPending}
          >
            <Share2 size={13} strokeWidth={1.5} /> Compartilhar com colaborador
          </button>
        )}
        <button
          type="button"
          onClick={abrirObservacaoInterna}
          className="inline-flex items-center gap-1 text-xs text-marrom font-medium"
          disabled={isPending}
        >
          <Pencil size={13} strokeWidth={1.5} /> Criar observação interna
        </button>
        {fb.status === 'novo' && (
          <button
            type="button"
            onClick={() => exec(() => marcarLido(fb.id))}
            className="inline-flex items-center gap-1 text-xs text-grafite"
            disabled={isPending}
          >
            <CheckCircle2 size={13} strokeWidth={1.5} /> Marcar como lido
          </button>
        )}
        {fb.status !== 'arquivado' && (
          <button
            type="button"
            onClick={() => exec(() => arquivar(fb.id))}
            className="inline-flex items-center gap-1 text-xs text-chumbo"
            disabled={isPending}
          >
            <Archive size={13} strokeWidth={1.5} /> Arquivar
          </button>
        )}
        <span className="ml-auto text-[11px] text-chumbo">{dataLonga(fb.created_at)}</span>
      </div>

      {/* MODAL: Compartilhar com colaborador */}
      {modal === 'compartilhar' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Compartilhar com {profNome}?</h4>
            <p className="text-sm text-grafite mb-5">
              Vamos criar uma observação no link de {profNome} com o comentário do cliente,
              visível imediatamente.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await compartilharComColaborador(fb.id)
                    if (res?.error) alert(res.error)
                    else { setModal(null); onChange() }
                  })
                }}
                className="btn-primary flex-1"
              >
                {isPending ? 'Compartilhando…' : 'Sim, compartilhar'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="text-grafite hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Observação interna */}
      {modal === 'observacao' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Criar observação interna</h4>
            <p className="text-sm text-chumbo mb-3">
              Vai entrar na próxima reunião. Pode editar o texto antes de salvar.
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['individual', 'equipe'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEscopoObs(v)}
                    className={[
                      'flex-1 py-2 rounded-md border text-sm font-medium',
                      escopoObs === v ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-text',
                    ].join(' ')}
                  >
                    {v === 'individual' ? 'Para colaborador' : 'Para a equipe'}
                  </button>
                ))}
              </div>
              {escopoObs === 'individual' && (
                <select
                  value={profObs}
                  onChange={(e) => setProfObs(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Selecione colaborador…</option>
                  {ativos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              )}
              <textarea
                value={textoObs}
                onChange={(e) => setTextoObs(e.target.value.slice(0, 2000))}
                rows={4}
                placeholder="Texto da observação"
                className="input text-sm"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const res = await criarObservacaoInterna({
                      feedbackClienteId: fb.id,
                      texto: textoObs,
                      profissionalId: escopoObs === 'individual' ? profObs || null : null,
                      escopo: escopoObs,
                    })
                    if (res?.error) alert(res.error)
                    else { setModal(null); onChange() }
                  })
                }}
                className="btn-primary flex-1"
              >
                {isPending ? 'Salvando…' : 'Criar observação'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="text-grafite hover:text-text px-4">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
