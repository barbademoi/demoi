'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
import { TIPOS, type TipoFeedback } from '@/lib/feedbacks'
import type { MetaSemanal, NovaMeta, PautaReuniao } from '@/lib/pauta'
import { finalizarReuniao } from '../../actions'

export interface FeedbackSlide {
  id: string
  profissional_id: string
  tipo: TipoFeedback
  estrelas: number | null
  texto: string
  categoria: string | null
  profissionais: { nome: string; foto_url: string | null } | null
}

interface ProfLite {
  id: string
  nome: string
  foto_url: string | null
}

type Slide =
  | { tipo: 'intro' }
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'feedback'; f: FeedbackSlide }
  | { tipo: 'metricas' }
  | { tipo: 'metaPassada'; meta: MetaSemanal }
  | { tipo: 'novasMetas' }
  | { tipo: 'fechamento' }

interface Props {
  reuniaoId: string
  estabNome: string
  dataLabel: string
  pautaInicial: PautaReuniao
  positivos: FeedbackSlide[]
  negativos: FeedbackSlide[]
  ativos: ProfLite[]
  metasPassadas: MetaSemanal[]
}

export default function ConduzirClient(props: Props) {
  const { reuniaoId, estabNome, dataLabel, pautaInicial, positivos, negativos, ativos, metasPassadas } = props
  const router = useRouter()

  const slides: Slide[] = [{ tipo: 'intro' }]
  if (positivos.length) {
    slides.push({ tipo: 'titulo', texto: '🎉 Elogios da semana' })
    positivos.forEach((f) => slides.push({ tipo: 'feedback', f }))
  }
  if (negativos.length) {
    slides.push({ tipo: 'titulo', texto: '🌱 Pontos a desenvolver' })
    negativos.forEach((f) => slides.push({ tipo: 'feedback', f }))
  }
  slides.push({ tipo: 'metricas' })
  if (metasPassadas.length) {
    slides.push({ tipo: 'titulo', texto: '🎯 Metas da semana passada' })
    metasPassadas.forEach((m) => slides.push({ tipo: 'metaPassada', meta: m }))
  }
  slides.push({ tipo: 'titulo', texto: '🚀 Novas metas' })
  slides.push({ tipo: 'novasMetas' })
  slides.push({ tipo: 'fechamento' })

  const [idx, setIdx] = useState(0)
  const [presentes, setPresentes] = useState<Set<string>>(new Set(pautaInicial.presentes ?? ativos.map((a) => a.id)))
  const [notas, setNotas] = useState<Record<string, string>>(pautaInicial.anotacoes ?? {})
  const [novasMetas, setNovasMetas] = useState<NovaMeta[]>(pautaInicial.novasMetas ?? [])
  const [finalizando, startFinalizar] = useTransition()
  const touchX = useRef<number | null>(null)

  const irPara = (n: number) => setIdx((i) => Math.max(0, Math.min(slides.length - 1, n)))
  const prox = () => irPara(idx + 1)
  const ant = () => irPara(idx - 1)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); prox() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ant() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, slides.length])

  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 50) (dx < 0 ? prox : ant)()
    touchX.current = null
  }

  function finalizar() {
    const pauta: PautaReuniao = {
      ...pautaInicial,
      presentes: Array.from(presentes),
      anotacoes: notas,
      novasMetas: novasMetas.filter((m) => m.texto.trim()),
    }
    startFinalizar(async () => {
      const res = await finalizarReuniao(reuniaoId, pauta)
      if (!res?.error) router.push(`/painel/reuniao/${reuniaoId}/resumo`)
    })
  }

  const nomePorId = (id: string | null) => (id ? ativos.find((a) => a.id === id)?.nome ?? '—' : 'Geral')
  const s = slides[idx]
  const metasValidas = novasMetas.filter((m) => m.texto.trim())

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          {s.tipo === 'intro' && (
            <div className="text-center space-y-4">
              <p className="text-text-muted">Reunião de</p>
              <h1 className="text-3xl font-bold text-text">{dataLabel}</h1>
              <p className="text-text-muted">{estabNome}</p>
              <div className="space-y-2 text-left max-w-xs mx-auto mt-6">
                {ativos.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-2 rounded-xl border border-border bg-white">
                    <input
                      type="checkbox"
                      checked={presentes.has(p.id)}
                      onChange={(e) => setPresentes((prev) => { const n = new Set(prev); e.target.checked ? n.add(p.id) : n.delete(p.id); return n })}
                      className="accent-primary w-5 h-5"
                    />
                    <Avatar nome={p.nome} fotoUrl={p.foto_url} size={32} />
                    <span className="text-sm text-text">{p.nome}</span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={prox} className="btn-primary mt-4">Começar</button>
            </div>
          )}

          {s.tipo === 'titulo' && (
            <h1 className="text-4xl font-extrabold text-center text-text">{s.texto}</h1>
          )}

          {s.tipo === 'feedback' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar nome={s.f.profissionais?.nome ?? '?'} fotoUrl={s.f.profissionais?.foto_url} size={96} />
              </div>
              <h2 className="text-2xl font-bold text-text">{s.f.profissionais?.nome}</h2>
              <div className="flex justify-center my-3">
                <Estrelas value={s.f.estrelas ?? 0} readOnly size={28} cor={TIPOS[s.f.tipo].estrela} />
              </div>
              <p className="text-xl text-text leading-relaxed">{s.f.texto}</p>
              {s.f.categoria && <p className="text-sm text-primary mt-2">{s.f.categoria}</p>}
              <textarea
                value={notas[s.f.id] ?? ''}
                onChange={(e) => setNotas((n) => ({ ...n, [s.f.id]: e.target.value }))}
                placeholder="Anotação durante a discussão…"
                rows={2}
                className="input mt-5 text-base"
              />
            </div>
          )}

          {s.tipo === 'metricas' && (
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-text">📊 Métricas</h2>
              <p className="text-lg text-text">Elogios discutidos: <strong>{positivos.length}</strong></p>
              <p className="text-lg text-text">Pontos a desenvolver: <strong>{negativos.length}</strong></p>
              {pautaInicial.metricasNotas && (
                <p className="text-text-muted whitespace-pre-wrap mt-3">{pautaInicial.metricasNotas}</p>
              )}
            </div>
          )}

          {s.tipo === 'metaPassada' && (
            <div className="text-center space-y-2">
              <p className="text-xl text-text font-medium">{s.meta.texto}</p>
              <p className="text-text-muted">Responsável: {nomePorId(s.meta.responsavel_id)}</p>
              {(() => {
                const av = pautaInicial.metasPassadas?.[s.meta.id]
                const map: Record<string, string> = { cumprida: '✅ Cumprida', parcial: '⚠️ Parcial', nao_cumprida: '❌ Não cumprida' }
                return <p className="text-lg mt-2">{av ? map[av.avaliacao] : 'Não avaliada'}{av?.comentario ? ` — ${av.comentario}` : ''}</p>
              })()}
            </div>
          )}

          {s.tipo === 'novasMetas' && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-text text-center mb-2">🚀 Novas metas</h2>
              {novasMetas.map((m, i) => (
                <div key={i} className="rounded-xl border border-border bg-white p-3 space-y-2">
                  <input
                    type="text"
                    value={m.texto}
                    onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                    placeholder="Texto da meta"
                    className="input text-base py-2.5"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={m.responsavel_id ?? ''}
                      onChange={(e) => setNovasMetas((arr) => arr.map((x, j) => (j === i ? { ...x, responsavel_id: e.target.value || null } : x)))}
                      className="input text-sm py-2 flex-1"
                    >
                      <option value="">Geral</option>
                      {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                    <button type="button" onClick={() => setNovasMetas((arr) => arr.filter((_, j) => j !== i))} className="text-red-600 text-sm px-2">Remover</button>
                  </div>
                </div>
              ))}
              {novasMetas.length < 3 && (
                <button type="button" onClick={() => setNovasMetas((m) => [...m, { texto: '', responsavel_id: null }])} className="btn-secondary w-full py-2.5 text-sm">
                  + Adicionar meta
                </button>
              )}
            </div>
          )}

          {s.tipo === 'fechamento' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-text">Fechamento</h2>
              <p className="text-lg text-text">{positivos.length + negativos.length} feedbacks discutidos</p>
              <p className="text-lg text-text">{metasValidas.length} meta{metasValidas.length === 1 ? '' : 's'} definida{metasValidas.length === 1 ? '' : 's'}</p>
              <button type="button" onClick={finalizar} disabled={finalizando} className="btn-primary w-full mt-4">
                {finalizando ? 'Finalizando…' : 'Finalizar reunião'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="border-t border-border bg-surface px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={ant} disabled={idx === 0} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">←</button>
        <span className="text-xs text-text-muted">{idx + 1} / {slides.length}</span>
        <button type="button" onClick={prox} disabled={idx === slides.length - 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">→</button>
      </div>
    </div>
  )
}
