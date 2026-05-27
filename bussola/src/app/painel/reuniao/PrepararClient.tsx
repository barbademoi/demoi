'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Users,
  BarChart3,
  Sprout,
  Target,
  Compass,
  Minus,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
import { TIPO_VISUAL } from '@/components/tipoVisual'
import { TIPOS, type TipoFeedback } from '@/lib/feedbacks'
import type { AvaliacaoMeta, DecisaoFeedback, MetaSemanal, NovaMeta, PautaReuniao } from '@/lib/pauta'
import { salvarPauta, marcarParticular } from './actions'
import SugestaoFala from './SugestaoFala'
import ResumoSemana from './ResumoSemana'

export interface ProfLite {
  id: string
  nome: string
  foto_url: string | null
}

export interface FeedbackSemana {
  id: string
  profissional_id: string | null
  tipo: TipoFeedback
  estrelas: number | null
  texto: string
  categoria: string | null
  created_at: string
  profissionais: { nome: string; foto_url: string | null } | null
}

export interface Alerta {
  profId: string
  nome: string
  foto_url: string | null
  grave: boolean
  razoes: string[]
  sugestao: string
  feedbackIds: string[]
}

interface Metricas {
  total: number
  totalInd: number
  totalEq: number
  positivos: number
  negativos: number
  observacoes: number
  maiorPlacar: { nome: string; valor: number }
  maisEvoluiu: { nome: string; delta: number }
  placarEquipe: number
}

interface Props {
  reuniaoId: string
  dataReuniaoLabel: string
  pautaInicial: PautaReuniao
  feedbacks: FeedbackSemana[]
  feedbacksEquipe: FeedbackSemana[]
  alertas: Alerta[]
  metasPassadas: MetaSemanal[]
  ativos: ProfLite[]
  metricas: Metricas
  mostrarResumo: boolean
}

function Bloco({ titulo, icon: Icon, children, dir }: { titulo: string; icon: LucideIcon; children: React.ReactNode; dir?: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)
  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between p-4"
      >
        <h2 className="font-semibold text-text text-left inline-flex items-center gap-2">
          <Icon size={20} strokeWidth={1.5} color="#8B6F47" /> {titulo}
        </h2>
        {aberto ? <Minus size={20} strokeWidth={1.5} color="#8A8A8A" /> : <Plus size={20} strokeWidth={1.5} color="#8A8A8A" />}
      </button>
      {aberto && <div className="px-4 pb-4 space-y-3">{dir}{children}</div>}
    </section>
  )
}

const DECISOES: { v: DecisaoFeedback; label: string; cls: string }[] = [
  { v: 'incluir', label: 'Incluir', cls: 'border-marrom bg-marrom text-white' },
  { v: 'particular', label: 'Em particular', cls: 'border-ambar bg-ambar text-white' },
  { v: 'ignorar', label: 'Ignorar', cls: 'border-chumbo bg-chumbo text-white' },
]

function MetricasResumo({ positivos, negativos, observacoes }: { positivos: number; negativos: number; observacoes: number }) {
  return (
    <span className="inline-flex items-center gap-3 flex-wrap">
      <span className="inline-flex items-center gap-1"><Sparkles size={14} strokeWidth={1.5} color="#5C7148" /> {positivos} positivos</span>
      <span className="inline-flex items-center gap-1"><Sprout size={14} strokeWidth={1.5} color="#A56336" /> {negativos} a desenvolver</span>
      <span className="inline-flex items-center gap-1"><Eye size={14} strokeWidth={1.5} color="#2D3E50" /> {observacoes} observações</span>
    </span>
  )
}

export default function PrepararClient(props: Props) {
  const { reuniaoId, dataReuniaoLabel, pautaInicial, feedbacks, feedbacksEquipe, alertas, metasPassadas, ativos, metricas, mostrarResumo } = props
  const router = useRouter()

  const decisoesIniciais: Record<string, DecisaoFeedback> = {}
  for (const f of [...feedbacks, ...feedbacksEquipe]) decisoesIniciais[f.id] = pautaInicial.decisoes?.[f.id] ?? 'incluir'

  const [decisoes, setDecisoes] = useState<Record<string, DecisaoFeedback>>(decisoesIniciais)
  const [metricasNotas, setMetricasNotas] = useState(pautaInicial.metricasNotas ?? '')
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { avaliacao: AvaliacaoMeta; comentario?: string }>>(
    pautaInicial.metasPassadas ?? {}
  )
  const [novasMetas, setNovasMetas] = useState<NovaMeta[]>(pautaInicial.novasMetas ?? [])
  const [mostrarTodosElogios, setMostrarTodosElogios] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const positivos = feedbacks.filter((f) => f.tipo === 'positivo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const negativos = feedbacks.filter((f) => f.tipo === 'negativo').sort((a, b) => (b.estrelas ?? 0) - (a.estrelas ?? 0))
  const elogiosVisiveis = mostrarTodosElogios ? positivos : positivos.slice(0, 5)

  const nomePorId = (id: string | null) => (id ? ativos.find((a) => a.id === id)?.nome ?? '—' : 'Geral')

  function montarPauta(extra?: Partial<PautaReuniao>): PautaReuniao {
    return {
      ...pautaInicial,
      decisoes,
      metricasNotas,
      metasPassadas: avaliacoes,
      novasMetas: novasMetas.filter((m) => m.texto.trim()),
      ...extra,
    }
  }

  function salvar() {
    setFeedback(null)
    startTransition(async () => {
      const res = await salvarPauta(reuniaoId, montarPauta())
      setFeedback(res?.error ? res.error : 'Pauta salva')
    })
  }

  function iniciar() {
    startTransition(async () => {
      await salvarPauta(reuniaoId, montarPauta({ iniciada_em: pautaInicial.iniciada_em ?? new Date().toISOString() }))
      router.push(`/painel/reuniao/${reuniaoId}/conduzir`)
    })
  }

  function marcarAlerta(a: Alerta) {
    startTransition(async () => {
      await marcarParticular(reuniaoId, a.feedbackIds)
      setDecisoes((d) => {
        const novo = { ...d }
        for (const id of a.feedbackIds) novo[id] = 'particular'
        return novo
      })
      router.refresh()
    })
  }

  function addMeta() {
    if (novasMetas.length >= 3) return
    setNovasMetas((m) => [...m, { texto: '', responsavel_id: null }])
  }

  const CardFeedback = ({ f, grave }: { f: FeedbackSemana; grave?: boolean }) => {
    const v = TIPO_VISUAL[f.tipo]
    return (
      <div className={`rounded-md border border-border p-3 bg-white border-l-[3px] ${grave ? 'border-l-ambar' : v.bordaEsq}`}>
        <div className="flex items-center gap-2">
          <Avatar nome={f.profissionais?.nome ?? '?'} fotoUrl={f.profissionais?.foto_url} size={32} />
          <span className="font-medium text-text text-sm">{f.profissionais?.nome}</span>
          <Estrelas value={f.estrelas ?? 0} readOnly size={14} cor={TIPOS[f.tipo].estrela} />
        </div>
        {grave && <p className="text-ambar text-xs font-medium mt-1">Sugerimos conversa individual</p>}
        <p className="text-sm text-text mt-1.5">{f.texto}</p>
        {f.categoria && (
          <span className="inline-block text-xs bg-linho text-grafite rounded-full px-2 py-0.5 mt-2">{f.categoria}</span>
        )}
        <div className="flex gap-1.5 mt-2">
          {DECISOES.map((d) => (
            <button
              key={d.v}
              type="button"
              onClick={() => setDecisoes((prev) => ({ ...prev, [f.id]: d.v }))}
              className={[
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                decisoes[f.id] === d.v ? d.cls : 'border-border bg-white text-grafite',
              ].join(' ')}
            >
              {d.label}
            </button>
          ))}
        </div>
        <SugestaoFala feedbackId={f.id} />
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-32 animate-fade-in">
      {/* CABEÇALHO */}
      <div className="card p-5">
        <h1 className="text-xl font-semibold text-text">Preparar reunião</h1>
        <p className="text-chumbo text-sm">{dataReuniaoLabel}</p>
        <p className="text-2xl font-bold text-marrom mt-3">{metricas.totalInd} individuais · {metricas.totalEq} de equipe</p>
        <p className="text-xs text-grafite mt-1.5"><MetricasResumo positivos={metricas.positivos} negativos={metricas.negativos} observacoes={metricas.observacoes} /></p>
      </div>

      {mostrarResumo && <ResumoSemana />}

      {/* ALERTAS */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a) => (
            <div
              key={a.profId}
              className={`card p-4 border-l-[3px] ${a.grave ? 'border-l-vinho' : 'border-l-ambar'}`}
            >
              <div className="flex items-center gap-2">
                <Avatar nome={a.nome} fotoUrl={a.foto_url} size={36} />
                <span className="font-semibold text-text">{a.nome}</span>
              </div>
              <ul className="text-sm text-text mt-2 list-disc pl-5">
                {a.razoes.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p className="text-xs text-chumbo mt-1">{a.sugestao}</p>
              {a.feedbackIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => marcarAlerta(a)}
                  disabled={isPending}
                  className="btn-secondary mt-3 px-3 py-2 text-sm"
                >
                  Marcar conversado em particular
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* BLOCO 1 — ELOGIOS */}
      <Bloco
        titulo="Elogios da semana"
        icon={Sparkles}
        dir={
          positivos.length > 5 ? (
            <button
              type="button"
              onClick={() => setMostrarTodosElogios((v) => !v)}
              className="text-xs text-marrom font-medium"
            >
              {mostrarTodosElogios ? 'Mostrar Top 5' : 'Mostrar todos'}
            </button>
          ) : null
        }
      >
        {positivos.length === 0 ? (
          <p className="text-chumbo text-sm">Nenhum elogio registrado nesta semana.</p>
        ) : (
          elogiosVisiveis.map((f) => <CardFeedback key={f.id} f={f} />)
        )}
      </Bloco>

      {/* BLOCO 2 — FEEDBACKS DE EQUIPE */}
      <Bloco titulo="Sobre a equipe" icon={Users}>
        {feedbacksEquipe.length === 0 ? (
          <p className="text-chumbo text-sm">Nenhum feedback de equipe nesta semana.</p>
        ) : (
          feedbacksEquipe.map((f) => {
            const v = TIPO_VISUAL[f.tipo]
            const TipoIcon = v.Icon
            return (
              <div key={f.id} className={`rounded-md border border-border bg-white p-3 border-l-[3px] ${v.bordaEsq}`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${v.badge}`}>
                    <TipoIcon size={13} strokeWidth={1.5} /> {v.label}
                  </span>
                  <Estrelas value={f.estrelas ?? 0} readOnly size={14} cor={TIPOS[f.tipo].estrela} />
                </div>
                <p className="text-sm text-text mt-1.5">{f.texto}</p>
                {f.categoria && <span className="inline-block mt-1 text-xs bg-linho text-grafite rounded-full px-2 py-0.5">{f.categoria}</span>}
                <div className="flex gap-1.5 mt-2">
                  {DECISOES.filter((d) => d.v !== 'particular').map((d) => (
                    <button
                      key={d.v}
                      type="button"
                      onClick={() => setDecisoes((prev) => ({ ...prev, [f.id]: d.v }))}
                      className={[
                        'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        decisoes[f.id] === d.v ? d.cls : 'border-border bg-white text-grafite',
                      ].join(' ')}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </Bloco>

      {/* BLOCO 3 — MÉTRICAS */}
      <Bloco titulo="Métricas da semana" icon={BarChart3}>
        <ul className="text-sm text-text space-y-1">
          <li>Feedbacks individuais: <strong>{metricas.totalInd}</strong> · de equipe: <strong>{metricas.totalEq}</strong></li>
          <li><MetricasResumo positivos={metricas.positivos} negativos={metricas.negativos} observacoes={metricas.observacoes} /></li>
          <li>Maior placar da semana: <strong>{metricas.maiorPlacar.nome}</strong> ({metricas.maiorPlacar.valor > 0 ? '+' : ''}{metricas.maiorPlacar.valor})</li>
          <li>Quem mais evoluiu: <strong>{metricas.maisEvoluiu.nome}</strong> ({metricas.maisEvoluiu.delta > 0 ? '+' : ''}{metricas.maisEvoluiu.delta})</li>
          <li>Placar da equipe: <strong>{metricas.placarEquipe > 0 ? '+' : ''}{metricas.placarEquipe}</strong></li>
        </ul>
        <textarea
          value={metricasNotas}
          onChange={(e) => setMetricasNotas(e.target.value)}
          rows={3}
          placeholder="Anotações de métricas externas (faturamento, dados do seu sistema, etc.)"
          className="input mt-2"
        />
      </Bloco>

      {/* BLOCO 4 — PONTOS A DESENVOLVER */}
      <Bloco titulo="Pontos a desenvolver" icon={Sprout}>
        {negativos.length === 0 ? (
          <p className="text-chumbo text-sm">Nenhum ponto negativo nesta semana.</p>
        ) : (
          negativos.map((f) => <CardFeedback key={f.id} f={f} grave={(f.estrelas ?? 0) >= 4} />)
        )}
      </Bloco>

      {/* BLOCO 5 — METAS PASSADAS */}
      <Bloco titulo="Metas da semana passada" icon={Target}>
        {metasPassadas.length === 0 ? (
          <p className="text-chumbo text-sm">
            Nenhuma meta definida na semana anterior. Você definirá as primeiras metas ao final desta reunião.
          </p>
        ) : (
          metasPassadas.map((m) => {
            const av = avaliacoes[m.id]
            return (
              <div key={m.id} className="rounded-md border border-border p-3">
                <p className="text-sm text-text font-medium">{m.texto}</p>
                <p className="text-xs text-chumbo">Responsável: {nomePorId(m.responsavel_id)}</p>
                <div className="flex gap-1.5 mt-2">
                  {([['cumprida', CheckCircle2, 'Cumprida'], ['parcial', AlertTriangle, 'Parcial'], ['nao_cumprida', XCircle, 'Não cumprida']] as [AvaliacaoMeta, LucideIcon, string][]).map(([v, AvIcon, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAvaliacoes((a) => ({ ...a, [m.id]: { ...a[m.id], avaliacao: v } }))}
                      className={[
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors',
                        av?.avaliacao === v ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-grafite',
                      ].join(' ')}
                    >
                      <AvIcon size={14} strokeWidth={1.5} /> {label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={av?.comentario ?? ''}
                  onChange={(e) => setAvaliacoes((a) => ({ ...a, [m.id]: { avaliacao: a[m.id]?.avaliacao ?? 'parcial', comentario: e.target.value } }))}
                  placeholder="Comentário (opcional)"
                  className="input mt-2 text-sm py-2"
                />
              </div>
            )
          })
        )}
      </Bloco>

      {/* BLOCO 6 — NOVAS METAS */}
      <Bloco titulo="Novas metas" icon={Compass}>
        {novasMetas.map((m, i) => (
          <div key={i} className="rounded-md border border-border p-3 space-y-2">
            <input
              type="text"
              value={m.texto}
              onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
              placeholder="Ex.: Cumprimentar todo cliente pelo nome"
              className="input text-sm py-2.5"
            />
            <div className="flex items-center gap-2">
              <select
                value={m.responsavel_id ?? ''}
                onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, responsavel_id: e.target.value || null } : x)))}
                className="input text-sm py-2 flex-1"
              >
                <option value="">Geral (toda a equipe)</option>
                {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <button type="button" onClick={() => setNovasMetas((arr) => arr.filter((_, j) => j !== i))} className="text-vinho text-sm px-2">
                Remover
              </button>
            </div>
          </div>
        ))}
        {novasMetas.length < 3 && (
          <button type="button" onClick={addMeta} className="btn-secondary w-full py-2.5 text-sm">
            <Plus size={16} strokeWidth={1.5} /> Adicionar meta
          </button>
        )}
        {novasMetas.length === 0 && <p className="text-chumbo text-xs">Sugestão: defina de 1 a 3 metas.</p>}
      </Bloco>

      {feedback && <p className="text-center text-sm text-chumbo">{feedback}</p>}

      {/* RODAPÉ FIXO (acima da bottom nav no mobile) */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-surface border-t border-border p-3 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button type="button" onClick={iniciar} disabled={isPending} className="btn-primary flex-1">
            <Play size={18} strokeWidth={1.5} /> Iniciar Modo Reunião
          </button>
          <button type="button" onClick={salvar} disabled={isPending} className="btn-secondary text-sm px-3">
            Salvar
          </button>
        </div>
      </div>
    </main>
  )
}
