'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { marcarFeedbackLido, arquivarFeedback, alternarBrindeUsado } from './actions'

interface Feedback {
  id: string; barbeiro_id: string | null
  estrelas: number; comentario: string | null
  nome_cliente: string | null; contato_cliente: string | null
  brinde_id: string | null; codigo_resgate: string | null
  brinde_usado: boolean; pontos_concedidos: number
  lido: boolean; arquivado: boolean
  data: string; created_at: string
  brindes: { nome: string; foto_url: string | null } | null
  barbeiros: { nome: string; foto_url: string | null } | null
}

interface Filtros {
  periodo: string; estrelas: string; comComentario: boolean
  barbeiroId: string; brindeId: string; arquivados: boolean
}

interface Props {
  feedbacks: Feedback[]
  barbeiros: { id: string; nome: string }[]
  brindes: { id: string; nome: string }[]
  filtros: Filtros
}

export default function PainelClient({ feedbacks, barbeiros, brindes, filtros }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [, startTransition] = useTransition()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp?.toString() || '')
    if (value && value !== 'todas' && value !== '0' && value !== '') params.set(key, value)
    else params.delete(key)
    router.push(`/dashboard/feedback-cliente/painel?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-text-muted text-[11px] font-sans uppercase tracking-wide block mb-1">Período</label>
          <select value={filtros.periodo} onChange={e => setParam('periodo', e.target.value)} className="input w-full text-xs py-1.5">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Últimos 12 meses</option>
          </select>
        </div>
        <div>
          <label className="text-text-muted text-[11px] font-sans uppercase tracking-wide block mb-1">Estrelas</label>
          <select value={filtros.estrelas} onChange={e => setParam('estrelas', e.target.value)} className="input w-full text-xs py-1.5">
            <option value="todas">Todas</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} estrelas</option>)}
          </select>
        </div>
        <div>
          <label className="text-text-muted text-[11px] font-sans uppercase tracking-wide block mb-1">Barbeiro</label>
          <select value={filtros.barbeiroId} onChange={e => setParam('barbeiroId', e.target.value)} className="input w-full text-xs py-1.5">
            <option value="">Todos</option>
            {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-text-muted text-[11px] font-sans uppercase tracking-wide block mb-1">Brinde</label>
          <select value={filtros.brindeId} onChange={e => setParam('brindeId', e.target.value)} className="input w-full text-xs py-1.5">
            <option value="">Todos</option>
            {brindes.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filtros.comComentario} onChange={e => setParam('comComentario', e.target.checked ? '1' : '')} className="w-4 h-4 accent-primary" />
          <span className="text-xs font-sans text-text">Com comentário</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filtros.arquivados} onChange={e => setParam('arquivados', e.target.checked ? '1' : '')} className="w-4 h-4 accent-primary" />
          <span className="text-xs font-sans text-text">Ver arquivados</span>
        </label>
      </div>

      {/* Lista */}
      {feedbacks.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-text-muted text-sm font-sans">Nenhum feedback no filtro atual.</p>
        </div>
      )}
      {feedbacks.map(f => (
        <FeedbackCard
          key={f.id}
          feedback={f}
          onMarcarLido={(lido) => startTransition(async () => { await marcarFeedbackLido(f.id, lido) })}
          onArquivar={(arq) => startTransition(async () => { await arquivarFeedback(f.id, arq) })}
          onBrindeUsado={(u) => startTransition(async () => { await alternarBrindeUsado(f.id, u) })}
        />
      ))}
    </div>
  )
}

function FeedbackCard({
  feedback: f, onMarcarLido, onArquivar, onBrindeUsado,
}: {
  feedback: Feedback
  onMarcarLido: (lido: boolean) => void
  onArquivar: (a: boolean) => void
  onBrindeUsado: (u: boolean) => void
}) {
  const dataFmt = new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`card p-4 sm:p-5 space-y-3 ${!f.lido ? 'border-primary/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-lg">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < f.estrelas ? 'text-yellow-400' : 'text-text-muted/30'}>★</span>
            ))}
          </div>
          {!f.lido && <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Novo</span>}
        </div>
        <p className="text-text-muted text-[11px] font-sans whitespace-nowrap">{dataFmt}</p>
      </div>

      <div className="text-sm font-sans space-y-1">
        {(f.nome_cliente || f.contato_cliente) && (
          <p className="text-text">
            {f.nome_cliente && <span className="font-semibold">{f.nome_cliente}</span>}
            {f.nome_cliente && f.contato_cliente && ' · '}
            {f.contato_cliente && <span className="text-text-muted">{f.contato_cliente}</span>}
          </p>
        )}
        {f.barbeiros?.nome && (
          <p className="text-text-muted text-xs">Sobre <span className="text-text">{f.barbeiros.nome}</span></p>
        )}
      </div>

      {f.comentario && (
        <p className="text-text text-sm font-sans whitespace-pre-line leading-relaxed bg-surface-2 rounded-xl p-3">
          “{f.comentario}”
        </p>
      )}

      {f.brindes && (
        <div className="flex items-center gap-3 bg-surface-2 rounded-xl p-3">
          {f.brindes.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.brindes.foto_url} alt={f.brindes.nome} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (<div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-lg shrink-0">🎁</div>)}
          <div className="flex-1 min-w-0">
            <p className="font-sans text-xs text-text-muted">Brinde sorteado</p>
            <p className="font-sans text-sm text-text truncate">{f.brindes.nome}</p>
          </div>
          {f.codigo_resgate && (
            <span className="font-serif text-base text-primary tracking-widest">{f.codigo_resgate}</span>
          )}
          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
            <input type="checkbox" checked={f.brinde_usado} onChange={e => onBrindeUsado(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-[11px] font-sans text-text-muted">Usado</span>
          </label>
        </div>
      )}

      {f.pontos_concedidos > 0 && (
        <p className="text-[11px] font-sans text-primary">
          +{f.pontos_concedidos} pts concedidos ao barbeiro
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onMarcarLido(!f.lido)}
          className="btn-ghost text-xs py-1.5 px-3 border border-border flex-1"
        >
          {f.lido ? '↺ Marcar como novo' : '✓ Marcar lido'}
        </button>
        <button
          onClick={() => onArquivar(!f.arquivado)}
          className="btn-ghost text-xs py-1.5 px-3 border border-border flex-1"
        >
          {f.arquivado ? '↺ Desarquivar' : '📦 Arquivar'}
        </button>
      </div>
    </div>
  )
}
