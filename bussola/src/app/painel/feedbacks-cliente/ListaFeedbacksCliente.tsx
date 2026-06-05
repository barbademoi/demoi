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
  Trash2,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import Modal from '@/components/Modal'
import { ListExpander } from '@/components/ui/ListExpander'
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
  brinde_validade_dias?: number | null
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

      {/* LISTA — ListExpander mostra primeiros 5 quando sem filtro; expande
          tudo automaticamente quando filtro ativo */}
      {lista2.length === 0 ? (
        <p className="text-chumbo text-sm text-center py-10">Nenhum feedback nesse filtro.</p>
      ) : (
        <ListExpander
          items={lista2}
          initialCount={5}
          alwaysExpanded={
            filtroStatus !== 'todos' ||
            filtroPeriodo !== 'tudo' ||
            filtroEstrelas.size > 0 ||
            filtroComComentario ||
            filtroColabId !== 'todos' ||
            filtroComBrinde
          }
          showMoreLabel={(r) => `Ver mais ${r} ${r === 1 ? 'feedback' : 'feedbacks'}`}
          renderItem={(f) => (
            <CardFeedback fb={f} ativos={ativos} onChange={() => router.refresh()} />
          )}
        />
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
  const [modal, setModal] = useState<null | 'compartilhar' | 'observacao' | 'excluir'>(null)
  const [removendo, setRemovendo] = useState(false) // fade-out ao excluir
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
    <div className={`card p-4 transition-opacity duration-300 ${removendo ? 'opacity-0' : 'opacity-100'}`}>
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
          {fb.codigo_resgate && fb.created_at && (() => {
            const dias = fb.brinde_validade_dias ?? 30
            const exp = new Date(new Date(fb.created_at).getTime() + dias * 24 * 60 * 60 * 1000)
            const expirou = exp.getTime() < Date.now()
            const fmt = exp.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            return (
              <p className={`text-[11px] mt-0.5 ${expirou ? 'text-chumbo/70' : 'text-chumbo'}`}>
                {expirou ? `Brinde expirado em ${fmt}` : `Brinde expira em ${fmt}`}
              </p>
            )
          })()}
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
        <button
          type="button"
          onClick={() => setModal('excluir')}
          className="inline-flex items-center gap-1 text-xs text-vinho"
          disabled={isPending}
        >
          <Trash2 size={13} strokeWidth={1.5} /> Excluir
        </button>
        <span className="ml-auto text-[11px] text-chumbo">{dataLonga(fb.created_at)}</span>
      </div>

      {/* MODAL: Compartilhar com colaborador */}
      <Modal open={modal === 'compartilhar'} onClose={() => setModal(null)}>
        <div className="p-5">
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
      </Modal>

      <Modal open={modal === 'observacao'} onClose={() => setModal(null)}>
        <div className="p-5">
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
      </Modal>

      {/* MODAL: Excluir definitivamente */}
      <Modal open={modal === 'excluir'} onClose={() => setModal(null)}>
        <div className="p-5">
          <h4 className="font-semibold text-text mb-2">Excluir este feedback?</h4>
          <p className="text-sm text-grafite mb-4">
            Esta ação é definitiva. O feedback será removido permanentemente e não pode ser recuperado.
          </p>

          {/* Resumo do feedback a excluir */}
          <div className="rounded-md border border-border bg-linho/50 p-3 mb-5 text-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    strokeWidth={1.5}
                    color="#8B6F47"
                    fill={n <= fb.estrelas ? '#8B6F47' : 'transparent'}
                  />
                ))}
              </span>
              <span className="text-xs text-chumbo">{dataLonga(fb.created_at)}</span>
            </div>
            <p className="text-xs text-chumbo mb-1">
              {fb.identificado && fb.nome_cliente ? fb.nome_cliente : 'Anônimo'}
            </p>
            {fb.comentario && (
              <p className="text-sm text-grafite italic">
                “{fb.comentario.length > 80 ? `${fb.comentario.slice(0, 80)}…` : fb.comentario}”
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    const r = await fetch(`/api/feedback-cliente/${fb.id}`, { method: 'DELETE' })
                    const j = await r.json().catch(() => ({}))
                    if (!r.ok) {
                      alert(j?.error ?? 'Não foi possível excluir.')
                      return
                    }
                    setModal(null)
                    setRemovendo(true)
                    setTimeout(() => onChange(), 300)
                  } catch {
                    alert('Sem conexão. Tente novamente.')
                  }
                })
              }}
              className="btn-destrutivo flex-1"
            >
              {isPending ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
            <button type="button" onClick={() => setModal(null)} className="text-grafite hover:text-text px-4">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
