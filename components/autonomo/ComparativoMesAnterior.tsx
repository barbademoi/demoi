'use client'

import { formatBRL, nomeMes } from '@/lib/utils'

interface Props {
  comissaoAtual: number
  comissaoMesAnterior: number
  mesAtual: number
  // Variante: 'dark' (Dashboard, fundo escuro) ou 'light' (/b/[codigo], card claro)
  variant?: 'dark' | 'light'
  // 'individual' (barbeiro) ou 'coletivo' (barbearia inteira) — muda os labels
  escopo?: 'individual' | 'coletivo'
  // Opcional: label do período anterior. Default usa nomeMes(mesAnterior) (mês calendário).
  // Pra ciclos personalizados, passar algo como "05 abr".
  labelPeriodoAnterior?: string
  // Opcional: label do período atual ("esse mês até agora" / "esse ciclo até agora").
  labelPeriodoAtual?: string
}

export default function ComparativoMesAnterior({
  comissaoAtual,
  comissaoMesAnterior,
  mesAtual,
  variant = 'dark',
  escopo = 'individual',
  labelPeriodoAnterior,
  labelPeriodoAtual,
}: Props) {
  // Sem dado do mês anterior → não renderiza (primeiro mês na plataforma)
  if (comissaoMesAnterior <= 0) return null

  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
  const labelAnterior = labelPeriodoAnterior ?? nomeMes(mesAnterior)
  const labelAtual = labelPeriodoAtual ?? 'Esse mês até agora'

  const variacaoAbs = comissaoAtual - comissaoMesAnterior
  const variacaoPct = Math.round((variacaoAbs / comissaoMesAnterior) * 100)
  const subiu = variacaoAbs > 0
  const igual = variacaoAbs === 0

  const isDark = variant === 'dark'
  const cardCls = isDark ? 'card p-5 space-y-3' : 'card-light p-5 space-y-3'
  const titleCls = isDark ? 'text-text-muted text-xs font-sans uppercase tracking-wide' : 'text-on-cream-muted text-xs font-sans uppercase tracking-wide'
  const labelCls = isDark ? 'text-text-muted text-xs font-sans' : 'text-on-cream-muted text-xs font-sans'
  const valueCls = isDark ? 'font-serif text-2xl text-text' : 'font-serif text-2xl text-on-cream'
  const dividerCls = isDark ? 'border-border' : 'border-cream-border'

  const trendColor = igual
    ? (isDark ? 'text-text-muted' : 'text-on-cream-muted')
    : subiu
      ? 'text-green-500'
      : 'text-red-500'
  const trendIcon = igual ? '→' : subiu ? '↑' : '↓'
  const trendLabel = igual
    ? 'mesmo ritmo'
    : subiu
      ? `+${variacaoPct}% vs ${labelAnterior}`
      : `${variacaoPct}% vs ${labelAnterior}`

  return (
    <div className={cardCls}>
      <p className={titleCls}>Comparativo</p>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className={labelCls}>
            {escopo === 'coletivo'
              ? `Em ${labelAnterior} a barbearia faturou`
              : `Em ${labelAnterior} você fez`}
          </p>
          <p className={valueCls}>{formatBRL(comissaoMesAnterior)}</p>
        </div>
        <div className={`w-px h-12 border-r ${dividerCls}`} />
        <div className="flex-1 min-w-0 text-right">
          <p className={labelCls}>{labelAtual}</p>
          <p className={valueCls}>{formatBRL(comissaoAtual)}</p>
        </div>
      </div>

      <div className={`flex items-center justify-center gap-2 pt-2 border-t ${dividerCls}`}>
        <span className={`font-serif text-2xl ${trendColor}`}>{trendIcon}</span>
        <span className={`text-sm font-sans font-semibold ${trendColor}`}>{trendLabel}</span>
      </div>
    </div>
  )
}
