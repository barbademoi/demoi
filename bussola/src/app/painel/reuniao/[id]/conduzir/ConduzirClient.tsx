'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import Estrelas from '@/components/Estrelas'
import { TIPOS, type TipoFeedback } from '@/lib/feedbacks'
import type { AvaliacaoMeta, MetaSemanal, NovaMeta, PautaReuniao } from '@/lib/pauta'
import { salvarPauta, finalizarReuniao, marcarDiscutido } from '../../actions'
import SugestaoFala from '../../SugestaoFala'
import DicaBloco from './DicaBloco'

export interface FbItem {
  id: string
  profissional_id: string | null
  escopo: 'individual' | 'equipe'
  tipo: TipoFeedback
  estrelas: number | null
  texto: string
  categoria: string | null
  status: string
  sugestao_ia: string | null
  profissionais: { nome: string; foto_url: string | null } | null
}

interface ProfLite {
  id: string
  nome: string
  foto_url: string | null
}

interface Metricas {
  total: number
  positivos: number
  negativos: number
  observacoes: number
  maiorPlacar: { nome: string; valor: number }
  maisEvoluiu: { nome: string; delta: number }
}

interface Props {
  reuniaoId: string
  dataLabel: string
  pautaInicial: PautaReuniao
  positivos: FbItem[]
  negativos: FbItem[]
  observacoes: FbItem[]
  equipe: FbItem[]
  ativos: ProfLite[]
  metasPassadas: MetaSemanal[]
  metricas: Metricas
  mostrarDicas: boolean
}

function Bloco({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(true)
  return (
    <section className="card overflow-hidden">
      <button type="button" onClick={() => setAberto((v) => !v)} className="w-full flex items-center justify-between p-4 text-left">
        <span>
          <span className="font-semibold text-text">{titulo}</span>
          {sub && <span className="text-text-muted text-sm font-normal"> {sub}</span>}
        </span>
        <span className="text-text-muted text-xl leading-none">{aberto ? '−' : '+'}</span>
      </button>
      <div className={aberto ? 'px-4 pb-4 space-y-3' : 'hidden'}>{children}</div>
    </section>
  )
}

export default function ConduzirClient(props: Props) {
  const { reuniaoId, dataLabel, pautaInicial, positivos, negativos, observacoes, equipe, ativos, metasPassadas, metricas, mostrarDicas } = props
  const router = useRouter()

  const todosFb = [...positivos, ...negativos, ...observacoes, ...equipe]

  // Contexto curto por bloco, para a "Dica da Bússola".
  const freq = (vals: (string | null)[]) => {
    const c: Record<string, number> = {}
    vals.forEach((v) => { if (v) c[v] = (c[v] ?? 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3).join(', ')
  }
  const nomesElogiados = (() => {
    const c: Record<string, number> = {}
    positivos.forEach((f) => { const n = f.profissionais?.nome; if (n) c[n] = (c[n] ?? 0) + 1 })
    return Object.entries(c).map(([n, q]) => `${n} (${q})`).join(', ')
  })()
  const maisForte = positivos[0]
  const placarEq = equipe.reduce((s, f) => s + (f.tipo === 'positivo' ? (f.estrelas ?? 0) : f.tipo === 'negativo' ? -(f.estrelas ?? 0) : 0), 0)
  const graves = negativos.filter((f) => (f.estrelas ?? 0) >= 4)
  const ctx: Record<string, string> = {
    elogios: `${positivos.length} elogios na semana. Elogiados: ${nomesElogiados || '—'}. Mais forte: ${maisForte ? `${maisForte.estrelas ?? 0}★ — ${maisForte.texto.slice(0, 80)}` : '—'}. Categoria mais frequente: ${freq(positivos.map((f) => f.categoria)) || '—'}.`,
    equipe: `${equipe.length} feedbacks de equipe. P/N/O: ${equipe.filter((f) => f.tipo === 'positivo').length}/${equipe.filter((f) => f.tipo === 'negativo').length}/${equipe.filter((f) => f.tipo === 'observacao').length}. Placar de equipe: ${placarEq}.`,
    desenvolvimento: `${negativos.length} feedbacks negativos, ${graves.length} graves (4-5★). Com feedback grave: ${Array.from(new Set(graves.map((f) => f.profissionais?.nome).filter(Boolean))).join(', ') || '—'}. Categorias: ${freq(negativos.map((f) => f.categoria)) || '—'}.`,
    observacoes: `${observacoes.length} observações. Temas: ${freq(observacoes.map((f) => f.categoria)) || observacoes.slice(0, 2).map((f) => f.texto.slice(0, 40)).join('; ') || '—'}.`,
    metricas: `${metricas.total} feedbacks na semana. Destaque (maior placar): ${metricas.maiorPlacar.nome}. Mais evoluiu: ${metricas.maisEvoluiu.nome}.`,
    metas_passadas: `${metasPassadas.length} metas da semana passada para revisar.`,
    metas_novas: `Planejando novas metas. Categorias problemáticas da semana: ${freq(negativos.map((f) => f.categoria)) || 'nenhuma'}.`,
  }

  const [discutidos, setDiscutidos] = useState<Set<string>>(
    new Set(todosFb.filter((f) => f.status.startsWith('discutido')).map((f) => f.id))
  )
  const [notas, setNotas] = useState<Record<string, string>>(pautaInicial.anotacoes ?? {})
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { avaliacao: AvaliacaoMeta; comentario?: string }>>(pautaInicial.metasPassadas ?? {})
  const [novasMetas, setNovasMetas] = useState<NovaMeta[]>(pautaInicial.novasMetas ?? [])
  const [metricasNotas, setMetricasNotas] = useState(pautaInicial.metricasNotas ?? '')
  const [metricasDiscutida, setMetricasDiscutida] = useState(!!pautaInicial.metricasDiscutida)
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
      anotacoes: notas,
      metasPassadas: avaliacoes,
      novasMetas: novasMetas.filter((m) => m.texto.trim()),
      metricasNotas,
      metricasDiscutida,
    }
  }

  // Salvamento da pauta com debounce de 1s (pula a 1ª renderização).
  const primeiraRef = useRef(true)
  useEffect(() => {
    if (primeiraRef.current) {
      primeiraRef.current = false
      return
    }
    const t = setTimeout(() => {
      salvarPauta(reuniaoId, montarPauta())
    }, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notas, avaliacoes, novasMetas, metricasNotas, metricasDiscutida])

  function toggle(f: FbItem) {
    setDiscutidos((prev) => {
      const n = new Set(prev)
      const novo = !n.has(f.id)
      if (novo) n.add(f.id)
      else n.delete(f.id)
      marcarDiscutido(f.id, novo)
      return n
    })
  }

  const nomePorId = (id: string | null) => (id ? ativos.find((a) => a.id === id)?.nome ?? '—' : 'Equipe')

  // Progresso.
  const novasValidas = novasMetas.filter((m) => m.texto.trim())
  const metasComAval = metasPassadas.filter((m) => avaliacoes[m.id]?.avaliacao).length
  const total = todosFb.length + 1 + metasPassadas.length + novasValidas.length
  const feitos = discutidos.size + (metricasDiscutida ? 1 : 0) + metasComAval + novasValidas.length
  const pendentes = Math.max(0, total - feitos)
  const pct = total ? Math.round((feitos / total) * 100) : 100

  function finalizar() {
    startFinalizar(async () => {
      const res = await finalizarReuniao(reuniaoId, montarPauta())
      if (!res?.error) router.push(`/painel/reuniao/${reuniaoId}/resumo`)
    })
  }

  const Card = ({ f }: { f: FbItem }) => {
    const marcado = discutidos.has(f.id)
    const grave = f.tipo === 'negativo' && (f.estrelas ?? 0) >= 4
    return (
      <div className={`rounded-xl border p-3 transition-opacity ${marcado ? 'opacity-50' : ''} ${grave ? 'border-orange-300 bg-orange-50' : 'border-border bg-white'}`}>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={marcado}
            onChange={() => toggle(f)}
            className="accent-primary mt-0.5 shrink-0"
            style={{ width: 24, height: 24 }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {f.escopo === 'individual' && f.profissionais ? (
                <>
                  <Avatar nome={f.profissionais.nome} fotoUrl={f.profissionais.foto_url} size={28} />
                  <span className="text-sm font-medium text-text">{f.profissionais.nome}</span>
                </>
              ) : (
                <span className="text-sm font-medium text-text">👥 Equipe</span>
              )}
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIPOS[f.tipo].badge}`}>{TIPOS[f.tipo].label}</span>
              <Estrelas value={f.estrelas ?? 0} readOnly size={14} cor={TIPOS[f.tipo].estrela} />
            </div>
            {grave && <p className="text-orange-700 text-xs font-medium mt-1">Conversa individual sugerida</p>}
            <p className="text-sm text-text mt-1.5">{f.texto}</p>
            {f.categoria && <span className="inline-block mt-1 text-xs bg-primary-soft text-primary rounded-full px-2 py-0.5">{f.categoria}</span>}
            {f.escopo === 'individual' && <SugestaoFala feedbackId={f.id} inicial={f.sugestao_ia} />}
            <textarea
              value={notas[f.id] ?? ''}
              onChange={(e) => setNotas((n) => ({ ...n, [f.id]: e.target.value }))}
              placeholder="Anotação…"
              rows={1}
              className="input mt-2 text-sm py-2 min-h-[40px]"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-28 animate-fade-in">
      {/* CABEÇALHO */}
      <div className="sticky top-[56px] z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-text">Reunião — {dataLabel}</p>
            <p className="text-xs text-text-muted">Tempo: {minutos} min</p>
          </div>
          <button type="button" onClick={() => (pendentes > 0 ? setConfirmar(true) : finalizar())} disabled={finalizando} className="btn-primary px-4 py-2 text-sm">
            Finalizar
          </button>
        </div>
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-text-muted mt-1">Progresso: {feitos}/{total} itens</p>
        </div>
      </div>

      {positivos.length > 0 && (
        <Bloco titulo="🎉 Elogios" sub={`(${positivos.length} — ${positivos.filter((f) => discutidos.has(f.id)).length} discutidos)`}>
          {mostrarDicas && <DicaBloco bloco="elogios" contexto={ctx.elogios} />}
          {positivos.map((f) => <Card key={f.id} f={f} />)}
        </Bloco>
      )}

      {equipe.length > 0 && (
        <Bloco titulo="👥 Sobre a equipe" sub={`(${equipe.length} — ${equipe.filter((f) => discutidos.has(f.id)).length} discutidos)`}>
          {mostrarDicas && <DicaBloco bloco="equipe" contexto={ctx.equipe} />}
          {equipe.map((f) => <Card key={f.id} f={f} />)}
        </Bloco>
      )}

      {negativos.length > 0 && (
        <Bloco titulo="🌱 Pontos a desenvolver" sub={`(${negativos.length} — ${negativos.filter((f) => discutidos.has(f.id)).length} discutidos)`}>
          {mostrarDicas && <DicaBloco bloco="desenvolvimento" contexto={ctx.desenvolvimento} />}
          {negativos.map((f) => <Card key={f.id} f={f} />)}
        </Bloco>
      )}

      {observacoes.length > 0 && (
        <Bloco titulo="👁 Observações" sub={`(${observacoes.length})`}>
          {mostrarDicas && <DicaBloco bloco="observacoes" contexto={ctx.observacoes} />}
          {observacoes.map((f) => <Card key={f.id} f={f} />)}
        </Bloco>
      )}

      {/* MÉTRICAS */}
      <Bloco titulo="📊 Métricas da semana">
        {mostrarDicas && <DicaBloco bloco="metricas" contexto={ctx.metricas} />}
        <ul className="text-sm text-text space-y-1">
          <li>Total: <strong>{metricas.total}</strong> · 🟢 {metricas.positivos} · 🔴 {metricas.negativos} · ⚪ {metricas.observacoes}</li>
          <li>Maior placar: <strong>{metricas.maiorPlacar.nome}</strong> ({metricas.maiorPlacar.valor > 0 ? '+' : ''}{metricas.maiorPlacar.valor})</li>
          <li>Mais evoluiu: <strong>{metricas.maisEvoluiu.nome}</strong> ({metricas.maisEvoluiu.delta > 0 ? '+' : ''}{metricas.maisEvoluiu.delta})</li>
        </ul>
        <textarea
          value={metricasNotas}
          onChange={(e) => setMetricasNotas(e.target.value)}
          rows={2}
          placeholder="Anotações de métricas externas (faturamento etc.)"
          className="input"
        />
        <label className="flex items-center gap-3 mt-1">
          <input type="checkbox" checked={metricasDiscutida} onChange={(e) => setMetricasDiscutida(e.target.checked)} className="accent-primary" style={{ width: 22, height: 22 }} />
          <span className="text-sm text-text">Discuti as métricas</span>
        </label>
      </Bloco>

      {/* METAS PASSADAS */}
      {metasPassadas.length > 0 && (
        <Bloco titulo="🎯 Metas da semana passada" sub={`(${metasComAval}/${metasPassadas.length})`}>
          {mostrarDicas && <DicaBloco bloco="metas_passadas" contexto={ctx.metas_passadas} />}
          {metasPassadas.map((m) => {
            const av = avaliacoes[m.id]
            return (
              <div key={m.id} className="rounded-xl border border-border p-3">
                <p className="text-sm text-text font-medium">{m.texto}</p>
                <p className="text-xs text-text-muted">Responsável: {nomePorId(m.responsavel_id)}</p>
                <div className="flex gap-1.5 mt-2">
                  {([['cumprida', '✅ Cumprida'], ['parcial', '⚠️ Parcial'], ['nao_cumprida', '❌ Não']] as [AvaliacaoMeta, string][]).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAvaliacoes((a) => ({ ...a, [m.id]: { ...a[m.id], avaliacao: v } }))}
                      className={['px-2.5 py-1.5 rounded-lg text-xs font-medium border', av?.avaliacao === v ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text-muted'].join(' ')}
                    >
                      {label}
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
          })}
        </Bloco>
      )}

      {/* NOVAS METAS */}
      <Bloco titulo="🚀 Novas metas" sub={`(${novasValidas.length})`}>
        {mostrarDicas && <DicaBloco bloco="metas_novas" contexto={ctx.metas_novas} />}
        {novasMetas.map((m, i) => (
          <div key={i} className="rounded-xl border border-border p-3 space-y-2">
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
                <option value="">Equipe</option>
                {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <button type="button" onClick={() => setNovasMetas((arr) => arr.filter((_, j) => j !== i))} className="text-red-600 text-sm px-2">Excluir</button>
            </div>
          </div>
        ))}
        {novasMetas.length < 3 && (
          <button type="button" onClick={() => setNovasMetas((m) => [...m, { texto: '', responsavel_id: null }])} className="btn-secondary w-full py-2.5 text-sm">
            + Adicionar nova meta
          </button>
        )}
        <p className="text-xs text-text-muted">Mínimo 1 meta, máximo 3.</p>
      </Bloco>

      {/* AÇÕES */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => (pendentes > 0 ? setConfirmar(true) : finalizar())} disabled={finalizando} className="btn-primary flex-1">
          {finalizando ? 'Finalizando…' : 'Finalizar reunião'}
        </button>
        <button type="button" onClick={() => { salvarPauta(reuniaoId, montarPauta()); router.push('/painel/reuniao') }} className="btn-secondary text-sm px-3">
          Salvar e depois
        </button>
      </div>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setConfirmar(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-text mb-2">Finalizar reunião?</h4>
            <p className="text-sm text-text-muted mb-5">Você tem {pendentes} {pendentes === 1 ? 'item' : 'itens'} sem discutir. Deseja mesmo finalizar?</p>
            <div className="flex gap-2">
              <button type="button" onClick={finalizar} disabled={finalizando} className="btn-primary flex-1">
                {finalizando ? 'Finalizando…' : 'Finalizar mesmo assim'}
              </button>
              <button type="button" onClick={() => setConfirmar(false)} className="text-text-muted hover:text-text px-4">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
