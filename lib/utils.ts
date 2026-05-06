import type { Tier } from '@/types/database'

/** Calcula percentual de progresso (0-100) sem ultrapassar 100 */
export function calcProgresso(comissao: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.min(Math.round((comissao / meta) * 100), 100)
}

/** Determina o tier atual com base na comissão e nas metas */
export function calcTier(
  comissao: number,
  bronzeComm: number,
  prataComm: number,
  ouroComm: number
): Tier | null {
  if (ouroComm > 0 && comissao >= ouroComm) return 'ouro'
  if (prataComm > 0 && comissao >= prataComm) return 'prata'
  if (bronzeComm > 0 && comissao >= bronzeComm) return 'bronze'
  return null
}

/** Gera link_codigo único para barbeiro (8 chars alfanumérico) */
export function gerarLinkCodigo(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

/** Formata valor como moeda BRL */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Nome completo do mês em português */
export function nomeMes(mes: number): string {
  return new Date(2024, mes - 1, 1).toLocaleString('pt-BR', { month: 'long' })
}

/** Retorna label e classe CSS de cada tier */
export const TIER_CONFIG = {
  bronze: { label: 'Bronze', barClass: 'bar-bronze', textClass: 'metal-text-bronze', shadow: 'shadow-bronze' },
  prata:  { label: 'Prata',  barClass: 'bar-silver', textClass: 'metal-text-silver', shadow: 'shadow-silver' },
  ouro:   { label: 'Ouro',   barClass: 'bar-gold',   textClass: 'metal-text-gold',   shadow: 'shadow-gold' },
} as const satisfies Record<Tier, { label: string; barClass: string; textClass: string; shadow: string }>
