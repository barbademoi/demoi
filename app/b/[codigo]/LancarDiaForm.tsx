'use client'

import { useState, useTransition, useMemo } from 'react'
import { lancarDiaBarbeiro } from './actions'
import type { CampanhaServico } from '@/types/database'

interface Props {
  linkCodigo: string
  servicos: CampanhaServico[]
  controleHoje: Record<string, number>   // servico_id → quantidade atual de hoje
  historico: { data: string; pontos: number; label: string }[]
  minPontos: number
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function labelData(iso: string): string {
  const hoje = toDateStr(new Date())
  const ontem = toDateStr(new Date(Date.now() - 86400000))
  if (iso === hoje) return 'Hoje'
  if (iso === ontem) return 'Ontem'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function LancarDiaForm({ linkCodigo, servicos, controleHoje, historico, minPontos }: Props) {
  const [contadores, setContadores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const s of servicos) init[s.id] = controleHoje[s.id] ?? 0
    return init
  })
  const [isPending, startTransition] = useTransition()
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const dataHoje = toDateStr(new Date())

  const totalPontos = useMemo(
    () => servicos.reduce((sum, s) => sum + (contadores[s.id] ?? 0) * s.pontos, 0),
    [contadores, servicos]
  )

  function inc(id: string) { setContadores(p => ({ ...p, [id]: (p[id] ?? 0) + 1 })) }
  function dec(id: string) { setContadores(p => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) })) }

  function salvar() {
    setErro(null)
    setSucesso(false)
    startTransition(async () => {
      const res = await lancarDiaBarbeiro({
        linkCodigo,
        data: dataHoje,
        servicos: servicos.map(s => ({ servico_id: s.id, quantidade: contadores[s.id] ?? 0 })),
      })
      if (res?.error) { setErro(res.error); return }
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    })
  }

  return (
    <div className="space-y-5">

      {/* Serviços */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-serif text-lg text-text">Lançar hoje</h3>
          <span className="text-text-muted text-xs font-sans">{dataHoje.split('-').reverse().join('/')}</span>
        </div>

        {servicos.map(s => (
          <div key={s.id} className="flex items-center gap-3">
            <span className="text-2xl w-8 text-center shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-text">{s.nome}</p>
              <p className="text-text-muted text-xs font-sans">{s.pontos} pts / unidade</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => dec(s.id)}
                disabled={!contadores[s.id]}
                className="w-9 h-9 rounded-xl bg-surface-2 border border-border text-text-muted
                  hover:text-text hover:border-primary/40 transition-all font-sans text-lg
                  disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                −
              </button>
              <span className={`font-serif text-xl w-8 text-center
                ${(contadores[s.id] ?? 0) > 0 ? 'text-text' : 'text-text-muted'}`}>
                {contadores[s.id] ?? 0}
              </span>
              <button
                onClick={() => inc(s.id)}
                className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary
                  hover:bg-primary/20 transition-all font-sans text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total + salvar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Total de hoje</p>
            <p className="font-serif text-4xl text-text mt-1">{totalPontos} <span className="text-xl text-text-muted">pts</span></p>
          </div>
          {totalPontos >= minPontos && (
            <span className="text-xs font-sans font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              ✓ Qualificado
            </span>
          )}
        </div>

        {erro && <p className="text-red-400 text-sm font-sans mb-3">{erro}</p>}

        <button
          onClick={salvar}
          disabled={isPending}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Salvando…
            </>
          ) : sucesso ? (
            <><span className="text-green-400">✓</span> Salvo!</>
          ) : (
            'Salvar meu dia'
          )}
        </button>
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div className="card p-5">
          <h3 className="font-serif text-base text-text mb-3">Últimos 7 dias</h3>
          <div className="space-y-2">
            {historico.map(h => (
              <div key={h.data} className="flex items-center gap-3">
                <span className="text-text-muted text-xs font-sans w-10 text-right shrink-0">{h.label}</span>
                <div className="flex-1 bar-track h-2">
                  <div
                    className="bar-gold h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (h.pontos / Math.max(...historico.map(x => x.pontos), 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-text-muted text-xs font-sans w-14 text-right shrink-0">
                  {h.pontos} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

