'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlayCircle, ClipboardList, Check, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import Avatar from '@/components/Avatar'
import type { PautaReuniao } from '@/lib/pauta'
import { finalizarReuniao, salvarPauta, marcarDiscutido } from '../../actions'
import type { ObsItem } from './ConduzirClient'

interface ProfLite { id: string; nome: string; foto_url: string | null }

interface Props {
  reuniaoId: string
  estabId: string
  dataLabel: string
  pautaInicial: PautaReuniao
  observacoes: ObsItem[]
  ativos: ProfLite[]
  periodoLabel: string
  proximoLabel: string
}

function profOf(o: ObsItem): { nome: string; foto_url: string | null } | null {
  if (!o.profissionais) return null
  if (Array.isArray(o.profissionais)) return o.profissionais[0] ?? null
  return o.profissionais
}

const ORDEM = ['abertura', 'observacoes', 'encerramento'] as const
type Etapa = (typeof ORDEM)[number]

const ETAPA_META: Record<Etapa, { titulo: string; icon: typeof PlayCircle; instrucao: string; principio: string }> = {
  abertura: {
    titulo: 'Abertura',
    icon: PlayCircle,
    instrucao: 'Cumprimente a equipe e abra o dia. Sem rodeios.',
    principio: 'Reunião diária pede pouca palavra e muito foco. Vá direto ao que importa.',
  },
  observacoes: {
    titulo: 'Observações',
    icon: ClipboardList,
    instrucao: 'Passe rapidamente pelo que aconteceu desde a última reunião. Marque o que já foi conversado.',
    principio: 'Diária não classifica em momentos. É um único bloco, em ordem cronológica, sem demora.',
  },
  encerramento: {
    titulo: 'Encerramento',
    icon: CheckCircle2,
    instrucao: 'Defina UMA prioridade pro dia. Quem ficar com qual foco?',
    principio: 'Diária boa termina com cada pessoa sabendo qual a prioridade do dia.',
  },
}

export default function ConduzirDiarioClient({
  reuniaoId,
  dataLabel,
  pautaInicial,
  observacoes,
  ativos,
  periodoLabel,
  proximoLabel,
}: Props) {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>(ORDEM[0])
  const [isPending, startTransition] = useTransition()
  const [marcados, setMarcados] = useState<Record<string, boolean>>(() => {
    const d = pautaInicial.decisoes ?? {}
    const out: Record<string, boolean> = {}
    for (const id of Object.keys(d)) if (d[id] === 'incluir') out[id] = true
    return out
  })
  const [metaDia, setMetaDia] = useState<{ texto: string; responsavel_id: string | null }>(() => {
    const m = (pautaInicial.novasMetas ?? [])[0]
    return { texto: m?.texto ?? '', responsavel_id: m?.responsavel_id ?? null }
  })

  function toggleMarcado(id: string) {
    setMarcados((cur) => ({ ...cur, [id]: !cur[id] }))
    marcarDiscutido(id, !marcados[id]).catch(() => {})
  }

  function salvar() {
    const decisoes: Record<string, 'incluir' | 'ignorar' | 'particular'> = {}
    for (const id of Object.keys(marcados)) if (marcados[id]) decisoes[id] = 'incluir'
    const novasMetas = metaDia.texto.trim()
      ? [{ texto: metaDia.texto.trim(), responsavel_id: metaDia.responsavel_id }]
      : []
    return salvarPauta(reuniaoId, {
      ...pautaInicial,
      decisoes,
      novasMetas,
      iniciada_em: pautaInicial.iniciada_em ?? new Date().toISOString(),
    })
  }

  function finalizar() {
    startTransition(async () => {
      await salvar()
      const decisoes: Record<string, 'incluir' | 'ignorar' | 'particular'> = {}
      for (const id of Object.keys(marcados)) if (marcados[id]) decisoes[id] = 'incluir'
      const novasMetas = metaDia.texto.trim()
        ? [{ texto: metaDia.texto.trim(), responsavel_id: metaDia.responsavel_id }]
        : []
      const r = await finalizarReuniao(reuniaoId, {
        ...pautaInicial,
        decisoes,
        novasMetas,
        iniciada_em: pautaInicial.iniciada_em ?? new Date().toISOString(),
      })
      if (!r?.error) router.push(`/painel/reuniao/${reuniaoId}/resumo`)
    })
  }

  const idx = ORDEM.indexOf(etapa)
  const meta = ETAPA_META[etapa]
  const Icon = meta.icon

  function avancar() {
    if (idx < ORDEM.length - 1) {
      startTransition(async () => { await salvar(); setEtapa(ORDEM[idx + 1]) })
    } else {
      finalizar()
    }
  }
  function voltar() { if (idx > 0) setEtapa(ORDEM[idx - 1]) }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in pb-24">
      <header>
        <p className="text-xs text-chumbo">Reunião diária · {dataLabel}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <h1 className="text-xl font-semibold text-text">{meta.titulo}</h1>
          <span className="text-xs text-chumbo">Etapa {idx + 1} de {ORDEM.length}</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-linho overflow-hidden">
          <div className="h-full bg-marrom transition-all" style={{ width: `${((idx + 1) / ORDEM.length) * 100}%` }} />
        </div>
      </header>

      <div className="card p-4 border-l-4 border-marrom bg-linho/40">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-marrom">
          <Icon size={14} strokeWidth={1.5} /> Princípio
        </p>
        <p className="text-sm text-text mt-1">{meta.principio}</p>
      </div>

      {etapa === 'abertura' && (
        <div className="card p-5 space-y-3">
          <p className="text-sm text-grafite">{meta.instrucao}</p>
          <p className="text-text">
            Sugestão de fala: <span className="italic">Bom dia, pessoal! Vamos alinhar rapidinho {periodoLabel}?</span>
          </p>
        </div>
      )}

      {etapa === 'observacoes' && (
        <div className="space-y-3">
          <p className="text-sm text-grafite">{meta.instrucao}</p>
          {observacoes.length === 0 ? (
            <div className="card p-5 text-center text-chumbo text-sm">
              Nenhuma observação {periodoLabel}. Encerre rapidamente com a prioridade do dia.
            </div>
          ) : (
            observacoes.map((o) => {
              const p = profOf(o)
              const on = !!marcados[o.id]
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleMarcado(o.id)}
                  className={`w-full text-left card p-3 flex items-start gap-3 transition-colors ${
                    on ? 'bg-linho/60 border-marrom' : 'hover:bg-linho/30'
                  }`}
                >
                  {p && <Avatar nome={p.nome} fotoUrl={p.foto_url} size={32} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-chumbo">{p?.nome ?? 'Equipe'} {o.categoria ? `· ${o.categoria}` : ''}</p>
                    <p className={`text-sm ${on ? 'line-through text-grafite' : 'text-text'}`}>{o.texto}</p>
                  </div>
                  <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${on ? 'bg-marrom border-marrom' : 'border-border'}`}>
                    {on && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      {etapa === 'encerramento' && (
        <div className="card p-5 space-y-3">
          <p className="text-sm text-grafite">{meta.instrucao}</p>
          <p className="text-text">
            Sugestão de fala: <span className="italic">Pra fechar, hoje o foco é…</span>
          </p>
          <div>
            <label className="text-xs text-chumbo font-medium">Prioridade do dia</label>
            <textarea
              value={metaDia.texto}
              onChange={(e) => setMetaDia((m) => ({ ...m, texto: e.target.value }))}
              rows={2}
              placeholder="Em uma frase, qual o foco?"
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-chumbo font-medium">Responsável (opcional)</label>
            <select
              value={metaDia.responsavel_id ?? ''}
              onChange={(e) => setMetaDia((m) => ({ ...m, responsavel_id: e.target.value || null }))}
              className="input mt-1"
            >
              <option value="">— Equipe inteira —</option>
              {ativos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-chumbo">
            Próxima reunião: {proximoLabel}.
          </p>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3 flex gap-2 max-w-2xl mx-auto">
        {idx > 0 && (
          <button type="button" onClick={voltar} className="btn-secondary">
            <ChevronLeft size={16} strokeWidth={1.5} /> Voltar
          </button>
        )}
        <button type="button" onClick={avancar} disabled={isPending} className="btn-primary flex-1 disabled:opacity-60">
          {idx === ORDEM.length - 1 ? (isPending ? 'Finalizando…' : 'Finalizar reunião') : 'Próximo'}
          {idx < ORDEM.length - 1 && <ChevronRight size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </main>
  )
}
