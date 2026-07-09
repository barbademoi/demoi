'use client'

import { useState, useTransition } from 'react'
import { lancarDiaBarbeiro, marcarNaoPontuei, reabrirDia } from './actions'
import type { CampanhaServico } from '@/types/database'

interface Props {
  linkCodigo: string
  diasEmAberto: string[]   // ISO 'YYYY-MM-DD', do início do ciclo até ontem
  diasMarcados: string[]   // ISO marcados como "não pontuei"
  servicos: CampanhaServico[]
}

function labelDia(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const [, m, dia] = iso.split('-')
  return `${semana} ${dia}/${m}`
}

export default function DiasEmAbertoAlerta({ linkCodigo, diasEmAberto, diasMarcados, servicos }: Props) {
  const [abertos, setAbertos] = useState<string[]>(diasEmAberto)
  const [marcados, setMarcados] = useState<string[]>(diasMarcados)
  const [diaForm, setDiaForm] = useState<string | null>(null)   // dia com form aberto
  const [contadores, setContadores] = useState<Record<string, number>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (abertos.length === 0 && marcados.length === 0) return null

  function abrirForm(dia: string) {
    setErro(null)
    setDiaForm(prev => (prev === dia ? null : dia))
    const init: Record<string, number> = {}
    for (const s of servicos) init[s.id] = 0
    setContadores(init)
  }
  function inc(id: string) { setContadores(p => ({ ...p, [id]: (p[id] ?? 0) + 1 })) }
  function dec(id: string) { setContadores(p => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) - 1) })) }

  function lancar(dia: string) {
    setErro(null)
    const total = servicos.reduce((s, sv) => s + (contadores[sv.id] ?? 0), 0)
    if (total === 0) { setErro('Some pelo menos 1 antes de salvar (ou use "Não pontuei").'); return }
    startTransition(async () => {
      const res = await lancarDiaBarbeiro({
        linkCodigo,
        data: dia,   // grava na DATA DO DIA, não em hoje
        servicos: servicos.map(s => ({ servico_id: s.id, quantidade: contadores[s.id] ?? 0 })),
      })
      if (res?.error) { setErro(res.error); return }
      setAbertos(prev => prev.filter(d => d !== dia))
      setDiaForm(null)
    })
  }

  function naoPontuei(dia: string) {
    setErro(null)
    startTransition(async () => {
      const res = await marcarNaoPontuei(linkCodigo, dia)
      if (res?.error) { setErro(res.error); return }
      setAbertos(prev => prev.filter(d => d !== dia))
      setMarcados(prev => [...prev, dia].sort())
      if (diaForm === dia) setDiaForm(null)
    })
  }

  function reabrir(dia: string) {
    setErro(null)
    startTransition(async () => {
      const res = await reabrirDia(linkCodigo, dia)
      if (res?.error) { setErro(res.error); return }
      setMarcados(prev => prev.filter(d => d !== dia))
      setAbertos(prev => [...prev, dia].sort())
    })
  }

  return (
    <div className="space-y-3">
      {abertos.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <div>
            <p className="text-amber-200 font-sans font-semibold text-sm">
              ⚠️ Você tem {abertos.length} {abertos.length === 1 ? 'dia sem lançamento' : 'dias sem lançamento'}
            </p>
            <p className="text-amber-200/80 text-xs font-sans mt-0.5 leading-relaxed">
              Lance na data certa pra não perder pontos, ou marque “Não pontuei” se não trabalhou.
            </p>
          </div>

          {erro && <p className="text-red-300 text-xs font-sans">{erro}</p>}

          <div className="space-y-2">
            {abertos.map(dia => (
              <div key={dia} className="rounded-xl bg-surface/60 border border-amber-500/20">
                <div className="flex items-center gap-2 p-2.5">
                  <span className="flex-1 text-text font-sans text-sm capitalize">{labelDia(dia)}</span>
                  <button
                    onClick={() => abrirForm(dia)}
                    disabled={isPending}
                    className="text-xs font-sans font-semibold text-white bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {diaForm === dia ? 'Fechar' : 'Lançar'}
                  </button>
                  <button
                    onClick={() => naoPontuei(dia)}
                    disabled={isPending}
                    className="text-xs font-sans text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    Não pontuei
                  </button>
                </div>

                {diaForm === dia && (
                  <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/60 pt-2.5">
                    {servicos.map(s => (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="text-xl w-7 text-center shrink-0">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-text truncate">{s.nome}</p>
                          <p className="text-text-muted text-xs font-sans">{s.pontos} pts / un.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => dec(s.id)} disabled={!contadores[s.id]}
                            className="w-8 h-8 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text disabled:opacity-30 flex items-center justify-center text-lg">−</button>
                          <span className={`font-serif text-lg w-7 text-center ${(contadores[s.id] ?? 0) > 0 ? 'text-text' : 'text-text-muted'}`}>{contadores[s.id] ?? 0}</span>
                          <button onClick={() => inc(s.id)}
                            className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 flex items-center justify-center text-lg">+</button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => lancar(dia)}
                      disabled={isPending}
                      className="btn-primary w-full py-2 text-sm mt-1"
                    >
                      {isPending ? 'Salvando…' : `Salvar ${labelDia(dia)}`}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {marcados.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-2/50 p-3">
          <p className="text-text-muted text-xs font-sans mb-2">
            Dias marcados como “não pontuei” ({marcados.length}) — clique pra reabrir se lançou por engano:
          </p>
          <div className="flex flex-wrap gap-2">
            {marcados.map(dia => (
              <button
                key={dia}
                onClick={() => reabrir(dia)}
                disabled={isPending}
                className="text-xs font-sans text-text-muted hover:text-text border border-border rounded-full px-3 py-1 hover:bg-surface transition-colors capitalize"
              >
                {labelDia(dia)} ↩︎
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
