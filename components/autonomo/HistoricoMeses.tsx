'use client'

import { formatBRL } from '@/lib/utils'

interface HistoricoEntry {
  mes: number
  ano: number
  comissao: number
  atendimentos?: number
  label: string
}

interface Props {
  historico: HistoricoEntry[]
  variant?: 'dark' | 'light'
  escopo?: 'individual' | 'coletivo'
}

export default function HistoricoMeses({ historico, variant = 'dark', escopo = 'individual' }: Props) {
  // Esconde se nenhum dos meses tem valor (cliente novíssimo)
  const algumValor = historico.some(h => h.comissao > 0)
  if (!algumValor) return null

  const max = Math.max(...historico.map(h => h.comissao), 1)
  // Índice do melhor mês (último, se empate)
  let bestIdx = 0
  for (let i = 0; i < historico.length; i++) {
    if (historico[i].comissao >= historico[bestIdx].comissao) bestIdx = i
  }

  const isDark = variant === 'dark'
  const cardCls = isDark ? 'card p-5 space-y-4' : 'card-light p-5 space-y-4'
  const titleCls = isDark ? 'text-text-muted text-xs font-sans uppercase tracking-wide' : 'text-on-cream-muted text-xs font-sans uppercase tracking-wide'
  const labelCls = isDark ? 'text-text-muted text-[11px] font-sans' : 'text-on-cream-muted text-[11px] font-sans'
  const valueCls = isDark ? 'text-text text-xs font-sans font-semibold' : 'text-on-cream text-xs font-sans font-semibold'
  const barTrackBg = isDark ? 'bg-surface-2' : 'bg-cream-surface'
  const barFillNormal = isDark ? 'bg-primary/40' : 'bg-primary/30'
  const barFillBest = 'bar-gold'

  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <p className={titleCls}>
          {escopo === 'coletivo' ? 'Histórico da barbearia' : 'Histórico'} — últimos {historico.length} meses
        </p>
        {historico[bestIdx].comissao > 0 && (
          <span className={`text-[11px] font-sans font-semibold ${isDark ? 'metal-text-gold' : 'metal-text-gold'}`}>
            ★ Melhor: {historico[bestIdx].label}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 h-32 pt-2">
        {historico.map((h, i) => {
          const altura = h.comissao > 0 ? Math.max(8, (h.comissao / max) * 100) : 3
          const isBest = i === bestIdx && h.comissao > 0
          return (
            <div key={`${h.ano}-${h.mes}`} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span className={`${valueCls} truncate w-full text-center`}>
                {h.comissao > 0 ? formatBRL(h.comissao).replace('R$ ', '') : '—'}
              </span>
              <div className={`w-full rounded-t-lg ${barTrackBg} flex items-end overflow-hidden`} style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${isBest ? barFillBest : barFillNormal}`}
                  style={{ height: `${altura}%` }}
                />
              </div>
              <span className={`${labelCls} truncate w-full text-center capitalize`}>
                {h.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
