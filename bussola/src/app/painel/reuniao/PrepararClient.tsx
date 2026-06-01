'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Sprout,
  Users,
  ClipboardList,
  Compass,
  PlayCircle,
  Loader2,
  Star,
  type LucideIcon,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import type { PautaReuniao } from '@/lib/pauta'
import type { Momento } from '@/lib/iaPrompts'
import { salvarPauta } from './actions'
import ResumoSemana from './ResumoSemana'

export interface ObsSemana {
  id: string
  profissional_id: string | null
  escopo: 'individual' | 'equipe'
  texto: string
  categoria: string | null
  momento_reuniao: Momento | null
  created_at: string
  profissionais: { nome: string; foto_url: string | null } | { nome: string; foto_url: string | null }[] | null
}

// Supabase às vezes devolve o relacionamento como array; normaliza pra objeto.
function profOf(o: ObsSemana): { nome: string; foto_url: string | null } | null {
  if (!o.profissionais) return null
  if (Array.isArray(o.profissionais)) return o.profissionais[0] ?? null
  return o.profissionais
}

export interface FbClienteSemana {
  id: string
  profissional_id: string | null
  estrelas: number
  comentario: string | null
  created_at: string
  profissionais: { nome: string; foto_url: string | null } | { nome: string; foto_url: string | null }[] | null
}

interface Props {
  reuniaoId: string
  dataReuniaoLabel: string
  pautaInicial: PautaReuniao
  observacoes: ObsSemana[]
  feedbacksCliente?: FbClienteSemana[]
  mostrarResumo: boolean
  periodoLabel?: string
}

const MOMENTO_META: Record<Momento, { titulo: string; icon: LucideIcon; cor: string }> = {
  reconhecimento: { titulo: 'Reconhecimento', icon: Sparkles, cor: '#5C7148' },
  ajuste: { titulo: 'Ajustes', icon: Sprout, cor: '#A56336' },
  equipe: { titulo: 'Equipe', icon: Users, cor: '#2D3E50' },
  neutro: { titulo: 'Neutro (fora da pauta)', icon: ClipboardList, cor: '#8A8A8A' },
}

const MOMENTOS_PAUTA: Momento[] = ['reconhecimento', 'equipe', 'ajuste', 'neutro']

export default function PrepararClient({ reuniaoId, dataReuniaoLabel, observacoes, feedbacksCliente, mostrarResumo, periodoLabel = 'esta semana' }: Props) {
  const router = useRouter()
  const [obs, setObs] = useState<ObsSemana[]>(observacoes)
  const [classificando, setClassificando] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Observações sem classificação ainda — dispara classificação na montagem.
  useEffect(() => {
    const pendentes = observacoes.filter((o) => !o.momento_reuniao).map((o) => o.id)
    if (pendentes.length === 0) return
    setClassificando(true)
    fetch('/api/ia/classificar-observacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: pendentes }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.resultados) {
          setObs((prev) =>
            prev.map((o) => (j.resultados[o.id] ? { ...o, momento_reuniao: j.resultados[o.id] as Momento } : o))
          )
        }
      })
      .catch(() => { /* silencioso */ })
      .finally(() => setClassificando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Observações de escopo equipe sempre caem em "equipe" no painel visual.
  // Defensivo: só aceita um dos 4 momentos válidos; qualquer outro vira 'neutro'.
  const efetivo = (o: ObsSemana): Momento => {
    if (o.escopo === 'equipe') return 'equipe'
    const m = o.momento_reuniao
    return m === 'reconhecimento' || m === 'ajuste' || m === 'equipe' || m === 'neutro' ? m : 'neutro'
  }

  const grupos = useMemo(() => {
    const m: Record<Momento, ObsSemana[]> = { reconhecimento: [], equipe: [], ajuste: [], neutro: [] }
    for (const o of obs) {
      const key = efetivo(o)
      ;(m[key] ?? m.neutro).push(o)
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obs])

  function reclassificar(id: string, novo: Momento) {
    setObs((prev) => prev.map((o) => (o.id === id ? { ...o, momento_reuniao: novo } : o)))
    fetch(`/api/feedback/${id}/momento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ momento: novo }),
    }).catch(() => { /* silencioso */ })
  }

  function iniciar() {
    startTransition(async () => {
      await salvarPauta(reuniaoId, { iniciada_em: new Date().toISOString(), momentoAtual: 1 })
      router.push(`/painel/reuniao/${reuniaoId}/conduzir`)
    })
  }

  function salvar() {
    startTransition(async () => {
      await salvarPauta(reuniaoId, {})
      router.refresh()
    })
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32 animate-fade-in">
      {/* CABEÇALHO */}
      <div className="card p-5">
        <h1 className="text-xl font-semibold text-text">Preparar reunião</h1>
        <p className="text-chumbo text-sm">{dataReuniaoLabel}</p>
        <p className="text-2xl font-bold text-marrom mt-3">
          {obs.length} observa{obs.length === 1 ? 'ção' : 'ções'} {periodoLabel}
        </p>
        {classificando && (
          <p className="text-xs text-chumbo mt-1 inline-flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" /> Classificando observações com IA…
          </p>
        )}
      </div>

      {mostrarResumo && <ResumoSemana />}

      {/* FEEDBACK DE CLIENTES DA SEMANA (se houver) */}
      {feedbacksCliente && feedbacksCliente.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold text-text mb-1 inline-flex items-center gap-2">
            <Star size={18} strokeWidth={1.5} color="#8B6F47" fill="#8B6F47" /> Feedback de clientes {periodoLabel}
          </h2>
          <p className="text-xs text-chumbo mb-3">
            {feedbacksCliente.length} feedback{feedbacksCliente.length === 1 ? '' : 's'} ·
            {' '}{(feedbacksCliente.reduce((s, f) => s + (f.estrelas ?? 0), 0) / feedbacksCliente.length).toFixed(1)} estrelas em média ·
            {' '}{feedbacksCliente.filter((f) => f.comentario).length} com comentário
          </p>
          <ul className="space-y-2">
            {feedbacksCliente
              .filter((f) => f.comentario)
              .slice(0, 5)
              .map((f) => {
                const p = f.profissionais
                const prof = !p ? null : Array.isArray(p) ? p[0] ?? null : p
                const trecho = f.comentario && f.comentario.length > 100 ? `${f.comentario.slice(0, 100)}…` : f.comentario
                return (
                  <li key={f.id} className="text-sm text-grafite">
                    <span className="inline-flex items-center gap-1 mr-1 text-marrom">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={12} strokeWidth={1.5} color="#8B6F47" fill={n <= f.estrelas ? '#8B6F47' : 'transparent'} />
                      ))}
                    </span>
                    {prof?.nome && <span className="text-text font-medium">{prof.nome}: </span>}
                    “{trecho}”
                  </li>
                )
              })}
          </ul>
          <p className="text-xs text-chumbo mt-3">
            Estes feedbacks aparecem como contexto na pauta. Não são classificados automaticamente nos momentos.
          </p>
        </section>
      )}

      {/* DISTRIBUIÇÃO PELOS MOMENTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MOMENTOS_PAUTA.map((m) => {
          const meta = MOMENTO_META[m]
          const Icon = meta.icon
          return (
            <div key={m} className="card p-3">
              <div className="inline-flex items-center gap-1.5 text-xs text-chumbo">
                <Icon size={14} strokeWidth={1.5} color={meta.cor} />
                {meta.titulo}
              </div>
              <p className="text-2xl font-semibold text-text mt-1">{grupos[m].length}</p>
            </div>
          )
        })}
      </div>

      {/* OBSERVAÇÕES POR MOMENTO */}
      {MOMENTOS_PAUTA.map((m) => {
        const lista = grupos[m]
        if (lista.length === 0) return null
        const meta = MOMENTO_META[m]
        const Icon = meta.icon
        return (
          <section key={m}>
            <h2 className="text-sm font-semibold text-text mb-2 inline-flex items-center gap-1.5">
              <Icon size={16} strokeWidth={1.5} color={meta.cor} />
              {meta.titulo} ({lista.length})
            </h2>
            <div className="space-y-2">
              {lista.map((o) => {
                const prof = profOf(o)
                return (
                <div key={o.id} className="card p-3">
                  <div className="flex items-start gap-2">
                    {o.escopo === 'individual' && prof ? (
                      <Avatar nome={prof.nome ?? '—'} fotoUrl={prof.foto_url} size={28} />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-linho flex items-center justify-center shrink-0">
                        <Users size={14} strokeWidth={1.5} color="#8B6F47" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs text-chumbo">
                        <span className="font-medium text-text">
                          {o.escopo === 'individual' ? prof?.nome ?? '—' : 'Equipe'}
                        </span>
                        {o.categoria && <span className="bg-linho text-grafite rounded-full px-2 py-0.5">{o.categoria}</span>}
                      </div>
                      <p className="text-sm text-text mt-1 whitespace-pre-wrap">{o.texto}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-chumbo">Mover para:</span>
                        <select
                          value={efetivo(o)}
                          disabled={o.escopo === 'equipe'}
                          onChange={(e) => reclassificar(o.id, e.target.value as Momento)}
                          className="text-xs rounded-md border border-border bg-white px-2 py-1 text-text disabled:opacity-50"
                        >
                          {MOMENTOS_PAUTA.map((m2) => (
                            <option key={m2} value={m2}>{MOMENTO_META[m2].titulo}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {obs.length === 0 && (
        <div className="card p-6 text-center text-chumbo text-sm">
          Nenhuma observação registrada {periodoLabel}. Você pode conduzir a reunião mesmo assim — vai entrar nos
          momentos que não dependem de observações.
        </div>
      )}

      <p className="text-xs text-chumbo mt-2 inline-flex items-center gap-1">
        <Compass size={12} strokeWidth={1.5} /> Reuniões seguem 6 momentos: Abertura, Revisão, Reconhecimentos, Equipe,
        Ajustes, Encerramento.
      </p>

      {/* RODAPÉ FIXO */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button type="button" onClick={iniciar} disabled={isPending} className="btn-primary flex-1">
            <PlayCircle size={18} strokeWidth={1.5} /> Iniciar Reunião
          </button>
          <button type="button" onClick={salvar} disabled={isPending} className="btn-secondary text-sm px-3">
            Salvar
          </button>
        </div>
      </div>
    </main>
  )
}
