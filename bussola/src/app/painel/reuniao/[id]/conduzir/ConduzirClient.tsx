'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Sprout,
  Users,
  Compass,
  ClipboardList,
  PlayCircle,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lightbulb,
  RotateCw,
  X,
  type LucideIcon,
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import type { AvaliacaoMeta, MetaSemanal, NovaMeta, PautaReuniao } from '@/lib/pauta'
import type { Momento } from '@/lib/iaPrompts'
import { salvarPauta, finalizarReuniao, marcarDiscutido } from '../../actions'

export interface ObsItem {
  id: string
  profissional_id: string | null
  escopo: 'individual' | 'equipe'
  texto: string
  categoria: string | null
  status: string
  momento_reuniao: Momento | null
  sugestao_ia: string | null
  profissionais: { nome: string; foto_url: string | null } | null
}

interface ProfLite {
  id: string
  nome: string
  foto_url: string | null
}

interface Props {
  reuniaoId: string
  estabId: string
  dataLabel: string
  pautaInicial: PautaReuniao
  observacoes: ObsItem[]
  ativos: ProfLite[]
  metasPassadas: MetaSemanal[]
  principios: Record<string, string> // momento -> texto
}

const ORDEM = ['abertura', 'revisao', 'reconhecimento', 'equipe', 'ajuste', 'encerramento'] as const
type MomentoTela = (typeof ORDEM)[number]

const META_TELAS: Record<MomentoTela, { titulo: string; instrucao: string; icon: LucideIcon; iaMomento?: Momento }> = {
  abertura: {
    titulo: 'Abertura',
    icon: PlayCircle,
    instrucao:
      'Comece reconhecendo a presença da equipe. Olhe nos olhos antes de falar. A energia que você traz define o tom de toda a reunião.',
  },
  revisao: {
    titulo: 'Revisão',
    icon: ClipboardList,
    instrucao:
      'Recapitule as metas combinadas na reunião anterior. Mostrar que você lembra é o que separa reunião que muda algo de reunião que vira papo.',
  },
  reconhecimento: {
    titulo: 'Reconhecimentos',
    icon: Sparkles,
    iaMomento: 'reconhecimento',
    instrucao:
      'Reconheça especificamente o que cada um fez bem. Comece pelo reconhecimento mais forte — ele define o tom de tudo o que vem depois.',
  },
  equipe: {
    titulo: 'Equipe',
    icon: Users,
    iaMomento: 'equipe',
    instrucao:
      'Fale sobre a equipe como um todo. Padrões, ambiente, energia da semana. Reforce o coletivo.',
  },
  ajuste: {
    titulo: 'Ajustes',
    icon: Sprout,
    iaMomento: 'ajuste',
    instrucao:
      'Aborde os pontos a ajustar com calma. Foco no comportamento observado, nunca no caráter da pessoa. Quem precisa de cobrança mais séria, considere conversar em particular.',
  },
  encerramento: {
    titulo: 'Metas e Encerramento',
    icon: Compass,
    instrucao:
      'Defina 1 a 3 metas pra próxima semana e encerre com clareza do que ficou decidido. A clareza é o presente final do líder.',
  },
}

const ABERTURA_ITENS = [
  { id: 'cumprimentei', label: 'Cumprimentei a equipe' },
  { id: 'tempo', label: 'Comuniquei o tempo previsto' },
  { id: 'tom', label: 'Estabeleci o tom (sereno, presente)' },
]

function Checkbox({ checked, onChange, size = 22 }: { checked: boolean; onChange: () => void; size?: number }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-marrom border-marrom' : 'bg-white border-border'}`}
      style={{ width: size, height: size }}
    >
      {checked && <Check size={size - 8} strokeWidth={2.5} color="#FFFFFF" />}
    </button>
  )
}

function CardPrincipio({ texto }: { texto: string }) {
  if (!texto) return null
  return (
    <div className="rounded-md border-l-[3px] border-marrom bg-linho p-4 mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-marrom mb-1">Princípio do Mentor</p>
      <p className="text-sm text-grafite italic leading-relaxed">{texto}</p>
    </div>
  )
}

function CardSugestaoFala({ momento, contexto }: { momento: Momento; contexto: string }) {
  const [sug, setSug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [oculto, setOculto] = useState(false)

  async function carregar(regenerar = false) {
    setLoading(true)
    try {
      const r = await fetch('/api/ia/sugestao-fala-momento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momento, contexto, regenerar }),
      })
      const j = await r.json()
      if (r.ok) setSug(j.sugestao)
      else setSug(null)
    } catch {
      setSug(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    carregar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momento])

  if (oculto) return null

  return (
    <div className="rounded-md border border-border bg-surface p-4 mt-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-marrom">
          <Lightbulb size={14} strokeWidth={1.5} /> Sugestão de fala
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => carregar(true)} disabled={loading} className="inline-flex items-center gap-1 text-xs text-marrom disabled:opacity-50">
            <RotateCw size={13} strokeWidth={1.5} /> Nova
          </button>
          <button type="button" onClick={() => setOculto(true)} className="text-chumbo" aria-label="Esconder">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-2.5 bg-marrom/10 rounded w-full animate-pulse" />
          <div className="h-2.5 bg-marrom/10 rounded w-2/3 animate-pulse" />
        </div>
      ) : (
        <p className="text-sm text-grafite italic leading-relaxed">{sug ?? 'Sugestão indisponível agora.'}</p>
      )}
    </div>
  )
}

function ObsCard({
  obs,
  marcado,
  toggle,
  nota,
  setNota,
  momento,
}: {
  obs: ObsItem
  marcado: boolean
  toggle: () => void
  nota: string
  setNota: (v: string) => void
  momento: Momento
}) {
  const [sug, setSug] = useState<string | null>(obs.sugestao_ia)
  const [loadingSug, setLoadingSug] = useState(false)

  async function gerarSug() {
    setLoadingSug(true)
    try {
      const r = await fetch('/api/ia/sugerir-fala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: obs.id, momento, regenerar: false }),
      })
      const j = await r.json()
      if (r.ok) setSug(j.sugestao)
    } catch { /* ignore */ }
    setLoadingSug(false)
  }

  return (
    <div className={`rounded-md border border-border p-3 bg-white transition-opacity ${marcado ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={marcado} onChange={toggle} size={22} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {obs.escopo === 'individual' && obs.profissionais ? (
              <>
                <Avatar nome={obs.profissionais.nome} fotoUrl={obs.profissionais.foto_url} size={28} />
                <span className="text-sm font-medium text-text">{obs.profissionais.nome}</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-text">
                <Users size={16} strokeWidth={1.5} color="#8B6F47" /> Equipe
              </span>
            )}
            {obs.categoria && (
              <span className="text-xs bg-linho text-grafite rounded-full px-2 py-0.5">{obs.categoria}</span>
            )}
          </div>
          <p className="text-sm text-text mt-1.5 whitespace-pre-wrap">{obs.texto}</p>

          {sug ? (
            <div className="mt-2 rounded-md bg-linho border border-border p-2.5">
              <p className="text-sm text-grafite italic">{sug}</p>
            </div>
          ) : (
            <button type="button" onClick={gerarSug} disabled={loadingSug} className="mt-2 inline-flex items-center gap-1 text-xs text-marrom font-medium disabled:opacity-50">
              <Lightbulb size={13} strokeWidth={1.5} /> {loadingSug ? 'Gerando…' : 'Sugestão de fala'}
            </button>
          )}

          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Anotação…"
            rows={1}
            className="input mt-2 text-sm py-2 min-h-[40px]"
          />
        </div>
      </div>
    </div>
  )
}

export default function ConduzirClient(props: Props) {
  const { reuniaoId, dataLabel, pautaInicial, observacoes, ativos, metasPassadas, principios } = props
  const router = useRouter()

  // Splits por momento.
  const recs = observacoes.filter((o) => o.momento_reuniao === 'reconhecimento')
  const ajustes = observacoes.filter((o) => o.momento_reuniao === 'ajuste')
  const equipe = observacoes.filter((o) => o.escopo === 'equipe' || o.momento_reuniao === 'equipe')
  // (neutros não aparecem na pauta)

  // Estado da reunião.
  const inicialMomento = pautaInicial.momentoAtual && pautaInicial.momentoAtual >= 1 && pautaInicial.momentoAtual <= 6 ? pautaInicial.momentoAtual : 1
  const [momento, setMomento] = useState<number>(inicialMomento)
  const tela = ORDEM[momento - 1]
  const metaTela = META_TELAS[tela]

  const [discutidos, setDiscutidos] = useState<Set<string>>(
    new Set(observacoes.filter((o) => o.status.startsWith('discutido')).map((o) => o.id))
  )
  const [notas, setNotas] = useState<Record<string, string>>(pautaInicial.anotacoes ?? {})
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { avaliacao: AvaliacaoMeta; comentario?: string }>>(pautaInicial.metasPassadas ?? {})
  const [novasMetas, setNovasMetas] = useState<NovaMeta[]>(pautaInicial.novasMetas ?? [])
  const [aberturaChecks, setAberturaChecks] = useState<Set<string>>(new Set(pautaInicial.aberturaChecks ?? []))
  const [notaEquipe, setNotaEquipe] = useState(pautaInicial.notaEquipe ?? '')
  const [anotacaoGeral, setAnotacaoGeral] = useState(pautaInicial.anotacaoGeral ?? '')
  const [confirmar, setConfirmar] = useState(false)
  const [finalizando, startFinalizar] = useTransition()

  const inicioMs = useRef(pautaInicial.iniciada_em ? Date.parse(pautaInicial.iniciada_em) : Date.now())
  const inicioISO = new Date(inicioMs.current).toISOString()
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const minutos = Math.floor((agora - inicioMs.current) / 60000)

  function montarPauta(): PautaReuniao {
    return {
      ...pautaInicial,
      iniciada_em: inicioISO,
      momentoAtual: momento,
      aberturaChecks: Array.from(aberturaChecks),
      notaEquipe,
      anotacoes: notas,
      anotacaoGeral,
      metasPassadas: avaliacoes,
      novasMetas: novasMetas.filter((m) => m.texto.trim()),
    }
  }

  // Auto-save com debounce.
  const primeiraRef = useRef(true)
  useEffect(() => {
    if (primeiraRef.current) {
      primeiraRef.current = false
      return
    }
    const t = setTimeout(() => salvarPauta(reuniaoId, montarPauta()), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momento, notas, avaliacoes, novasMetas, aberturaChecks, notaEquipe, anotacaoGeral])

  function toggle(obs: ObsItem) {
    setDiscutidos((prev) => {
      const n = new Set(prev)
      const novo = !n.has(obs.id)
      if (novo) n.add(obs.id)
      else n.delete(obs.id)
      marcarDiscutido(obs.id, novo)
      return n
    })
  }

  function nomePorId(id: string | null): string {
    if (!id) return 'Equipe'
    return ativos.find((a) => a.id === id)?.nome ?? '—'
  }

  function finalizar() {
    startFinalizar(async () => {
      const res = await finalizarReuniao(reuniaoId, montarPauta())
      if (!res?.error) router.push(`/painel/reuniao/${reuniaoId}/resumo`)
    })
  }

  function sair() {
    salvarPauta(reuniaoId, montarPauta())
    router.push('/painel/reuniao')
  }

  // Contexto pra sugestao-fala-momento (mantém prompt curto).
  function contextoIA(): string {
    if (tela === 'reconhecimento') {
      const nomes = Array.from(new Set(recs.map((o) => o.profissionais?.nome).filter(Boolean))) as string[]
      return `${recs.length} reconhecimentos. Pessoas: ${nomes.join(', ') || '—'}.`
    }
    if (tela === 'ajuste') {
      const nomes = Array.from(new Set(ajustes.map((o) => o.profissionais?.nome).filter(Boolean))) as string[]
      return `${ajustes.length} pontos a desenvolver. Pessoas: ${nomes.join(', ') || '—'}.`
    }
    if (tela === 'equipe') {
      return `${equipe.length} observações sobre a equipe esta semana.`
    }
    return ''
  }

  const totalMomentos = 6
  const proxLabel = momento < totalMomentos ? META_TELAS[ORDEM[momento]].titulo : 'Finalizar reunião'

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto">
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-chumbo truncate">Reunião — {dataLabel} · {minutos} min</p>
            <p className="text-sm font-semibold text-text inline-flex items-center gap-1.5">
              <metaTela.icon size={16} strokeWidth={1.5} color="#8B6F47" />
              Momento {momento}/6 — {metaTela.titulo}
            </p>
          </div>
          <button type="button" onClick={sair} className="btn-secondary px-3 py-2 text-xs">
            Sair
          </button>
        </div>
        <div className="h-1 bg-linho">
          <div className="h-full bg-marrom transition-all" style={{ width: `${(momento / totalMomentos) * 100}%` }} />
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-semibold text-text">{metaTela.titulo}</h1>
        <p className="text-sm text-grafite mt-1 leading-relaxed">{metaTela.instrucao}</p>

        <CardPrincipio texto={principios[tela] ?? ''} />

        {/* CONTEÚDO POR MOMENTO */}
        {tela === 'abertura' && (
          <div className="card p-4 mt-4 space-y-2">
            {ABERTURA_ITENS.map((it) => {
              const on = aberturaChecks.has(it.id)
              return (
                <label key={it.id} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={on}
                    onChange={() =>
                      setAberturaChecks((prev) => {
                        const n = new Set(prev)
                        if (n.has(it.id)) n.delete(it.id)
                        else n.add(it.id)
                        return n
                      })
                    }
                  />
                  <span className="text-sm text-text">{it.label}</span>
                </label>
              )
            })}
          </div>
        )}

        {tela === 'revisao' && (
          <div className="space-y-3 mt-4">
            {metasPassadas.length === 0 ? (
              <p className="text-chumbo text-sm card p-4">
                Esta é a primeira reunião. As próximas terão metas pra revisar aqui.
              </p>
            ) : (
              metasPassadas.map((m) => {
                const av = avaliacoes[m.id]
                return (
                  <div key={m.id} className="rounded-md border border-border p-3 bg-white">
                    <p className="text-sm text-text font-medium">{m.texto}</p>
                    <p className="text-xs text-chumbo">Responsável: {nomePorId(m.responsavel_id)}</p>
                    <div className="flex gap-1.5 mt-2">
                      {([['cumprida', CheckCircle2, 'Cumprida'], ['parcial', AlertTriangle, 'Parcial'], ['nao_cumprida', XCircle, 'Não cumprida']] as [AvaliacaoMeta, LucideIcon, string][]).map(([v, AvIcon, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAvaliacoes((a) => ({ ...a, [m.id]: { ...a[m.id], avaliacao: v } }))}
                          className={['inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border', av?.avaliacao === v ? 'border-marrom bg-marrom text-white' : 'border-border bg-white text-grafite'].join(' ')}
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
          </div>
        )}

        {tela === 'reconhecimento' && (
          <div className="space-y-3 mt-4">
            {recs.length === 0 ? (
              <p className="text-chumbo text-sm card p-4">
                Nenhum reconhecimento classificado nesta semana. Use este momento mesmo assim — pense em algo positivo que viu acontecer.
              </p>
            ) : (
              recs.map((o) => (
                <ObsCard
                  key={o.id}
                  obs={o}
                  marcado={discutidos.has(o.id)}
                  toggle={() => toggle(o)}
                  nota={notas[o.id] ?? ''}
                  setNota={(v) => setNotas((n) => ({ ...n, [o.id]: v }))}
                  momento="reconhecimento"
                />
              ))
            )}
          </div>
        )}

        {tela === 'equipe' && (
          <div className="space-y-3 mt-4">
            {equipe.length > 0 && (
              <div className="space-y-3">
                {equipe.map((o) => (
                  <ObsCard
                    key={o.id}
                    obs={o}
                    marcado={discutidos.has(o.id)}
                    toggle={() => toggle(o)}
                    nota={notas[o.id] ?? ''}
                    setNota={(v) => setNotas((n) => ({ ...n, [o.id]: v }))}
                    momento="equipe"
                  />
                ))}
              </div>
            )}
            <div className="card p-4">
              <p className="text-xs text-chumbo mb-2">Anotação livre sobre o coletivo</p>
              <textarea
                value={notaEquipe}
                onChange={(e) => setNotaEquipe(e.target.value)}
                rows={3}
                placeholder="O que percebeu da equipe esta semana?"
                className="input"
              />
            </div>
          </div>
        )}

        {tela === 'ajuste' && (
          <div className="space-y-3 mt-4">
            {(() => {
              const porProf: Record<string, number> = {}
              for (const o of ajustes) {
                if (o.profissional_id) porProf[o.profissional_id] = (porProf[o.profissional_id] ?? 0) + 1
              }
              const repetidos = Object.entries(porProf).filter(([, n]) => n >= 2)
              if (repetidos.length === 0) return null
              return (
                <div className="rounded-md border-l-[3px] border-ambar bg-ambar/5 p-3 text-sm text-grafite">
                  <p className="font-medium text-text mb-1">Conversa em particular</p>
                  <p>
                    {repetidos.map(([id]) => nomePorId(id)).join(', ')} tem 2+ pontos de ajuste. Considere falar em
                    particular antes ou depois da reunião.
                  </p>
                </div>
              )
            })()}
            {ajustes.length === 0 ? (
              <p className="text-chumbo text-sm card p-4">
                Nenhum ajuste apontado nesta semana. Aproveite — não force ajustes que não existem.
              </p>
            ) : (
              ajustes.map((o) => (
                <ObsCard
                  key={o.id}
                  obs={o}
                  marcado={discutidos.has(o.id)}
                  toggle={() => toggle(o)}
                  nota={notas[o.id] ?? ''}
                  setNota={(v) => setNotas((n) => ({ ...n, [o.id]: v }))}
                  momento="ajuste"
                />
              ))
            )}
          </div>
        )}

        {tela === 'encerramento' && (
          <div className="space-y-3 mt-4">
            {novasMetas.map((m, i) => (
              <div key={i} className="rounded-md border border-border p-3 space-y-2">
                <input
                  type="text"
                  value={m.texto}
                  onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                  placeholder="Ex.: Cumprimentar cada cliente pelo nome"
                  className="input text-sm py-2.5"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={m.responsavel_id ?? ''}
                    onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, responsavel_id: e.target.value || null } : x)))}
                    className="input text-sm py-2 flex-1"
                  >
                    <option value="">Equipe</option>
                    {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <button type="button" onClick={() => setNovasMetas((arr) => arr.filter((_, j) => j !== i))} className="text-vinho text-sm px-2">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {novasMetas.length < 3 && (
              <button type="button" onClick={() => setNovasMetas((m) => [...m, { texto: '', responsavel_id: null }])} className="btn-secondary w-full py-2.5 text-sm">
                <Plus size={16} strokeWidth={1.5} /> Adicionar meta
              </button>
            )}
            <p className="text-xs text-chumbo">Mínimo 1 meta, máximo 3.</p>

            <div className="card p-4">
              <p className="text-xs text-chumbo mb-2">Anotação final</p>
              <textarea
                value={anotacaoGeral}
                onChange={(e) => setAnotacaoGeral(e.target.value)}
                rows={3}
                placeholder="O que fica decidido pra próxima semana?"
                className="input"
              />
            </div>
          </div>
        )}

        {metaTela.iaMomento && <CardSugestaoFala momento={metaTela.iaMomento} contexto={contextoIA()} />}
      </main>

      {/* RODAPÉ FIXO COM NAVEGAÇÃO */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {momento > 1 && (
            <button type="button" onClick={() => setMomento((n) => n - 1)} className="btn-secondary text-sm px-3">
              <ChevronLeft size={16} strokeWidth={1.5} /> Anterior
            </button>
          )}
          {momento < totalMomentos ? (
            <button type="button" onClick={() => setMomento((n) => n + 1)} className="btn-primary flex-1">
              {proxLabel} <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} disabled={finalizando} className="btn-primary flex-1">
              {finalizando ? 'Finalizando…' : 'Finalizar reunião'}
            </button>
          )}
        </div>
      </footer>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmar(false)}>
          <div className="bg-surface rounded-lg w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Finalizar reunião?</h4>
            <p className="text-sm text-grafite mb-5">
              Vamos registrar as metas, marcar os itens discutidos e abrir o resumo.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={finalizar} disabled={finalizando} className="btn-primary flex-1">
                {finalizando ? 'Finalizando…' : 'Sim, finalizar'}
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="text-grafite hover:text-text px-4">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
