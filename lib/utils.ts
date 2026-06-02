import type { Tier } from '@/types/database'

// ── Dias úteis (Seg-Sáb, excluindo feriados nacionais) ──────────────────────

/** Domingo de Páscoa pelo algoritmo anônimo gregoriano */
function calcEaster(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, month - 1, day)
}

/** Conjunto de dias (1-31) que são feriados nacionais no mês/ano dado */
function feriadosNacionais(ano: number, mes: number): Set<number> {
  const s = new Set<number>()
  const add = (m: number, d: number) => { if (m === mes) s.add(d) }

  // Feriados fixos
  add(1, 1)   // Confraternização Universal
  add(4, 21)  // Tiradentes
  add(5, 1)   // Dia do Trabalhador
  add(9, 7)   // Independência
  add(10, 12) // Nossa Senhora Aparecida
  add(11, 2)  // Finados
  add(11, 15) // Proclamação da República
  add(11, 20) // Consciência Negra
  add(12, 25) // Natal

  // Feriados móveis baseados na Páscoa
  const easter = calcEaster(ano)
  const addDate = (offset: number) => {
    const dt = new Date(easter)
    dt.setDate(easter.getDate() + offset)
    if (dt.getFullYear() === ano && dt.getMonth() + 1 === mes) s.add(dt.getDate())
  }
  addDate(-2) // Sexta-Feira Santa
  addDate(60) // Corpus Christi

  return s
}

/**
 * Calcula dias úteis (Seg–Sáb, excluindo feriados nacionais) no mês.
 * @returns totalDiasUteis, diasUteisCorridos (até diaAtual inclusive), diasUteisRestantes
 */
export function calcDiasUteis(ano: number, mes: number, diaAtual: number) {
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const feriados = feriadosNacionais(ano, mes)
  let totalDiasUteis = 0
  let diasUteisCorridos = 0
  let diasUteisRestantes = 0

  for (let d = 1; d <= diasNoMes; d++) {
    const dow = new Date(ano, mes - 1, d).getDay()
    if (dow !== 0 && !feriados.has(d)) { // não domingo e não feriado
      totalDiasUteis++
      if (d <= diaAtual) diasUteisCorridos++
      else diasUteisRestantes++
    }
  }

  return { totalDiasUteis, diasUteisCorridos, diasUteisRestantes }
}

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

/**
 * 'YYYY-MM-DD' no fuso LOCAL (servidor: BRT via TZ env; cliente: TZ do navegador).
 * NÃO usar `toISOString().split('T')[0]` pra isso — toISOString() sempre
 * serializa em UTC, então das 21h BRT em diante devolve o dia seguinte
 * mesmo com a Date construída no fuso certo.
 */
export function dataLocalStr(d: Date = new Date()): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Retorna label e classe CSS de cada tier */
export const TIER_CONFIG = {
  bronze: { label: 'Bronze', barClass: 'bar-bronze', textClass: 'metal-text-bronze', shadow: 'shadow-bronze' },
  prata:  { label: 'Prata',  barClass: 'bar-silver', textClass: 'metal-text-silver', shadow: 'shadow-silver' },
  ouro:   { label: 'Ouro',   barClass: 'bar-gold',   textClass: 'metal-text-gold',   shadow: 'shadow-gold' },
} as const satisfies Record<Tier, { label: string; barClass: string; textClass: string; shadow: string }>
