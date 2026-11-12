/**
 * Datas e horas do Tarefix. Fuso FIXO: America/Sao_Paulo em todos os cálculos.
 * Datas "do dia" circulam como string 'AAAA-MM-DD' (nunca Date local),
 * para não depender do fuso do servidor (Vercel roda em UTC) nem do aparelho.
 */

export const FUSO = 'America/Sao_Paulo'

const fmtPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

export type AgoraSP = {
  data: string // 'AAAA-MM-DD'
  hora: string // 'HH:MM'
  minutosDoDia: number // 0..1439
}

export function agoraSP(ref: Date = new Date()): AgoraSP {
  const p = Object.fromEntries(fmtPartes.formatToParts(ref).map((x) => [x.type, x.value]))
  const h = Number(p.hour)
  const m = Number(p.minute)
  return {
    data: `${p.year}-${p.month}-${p.day}`,
    hora: `${p.hour}:${p.minute}`,
    minutosDoDia: h * 60 + m,
  }
}

export function hojeSP(ref: Date = new Date()): string {
  return agoraSP(ref).data
}

/** 'AAAA-MM' de uma data 'AAAA-MM-DD'. */
export function anoMesDe(data: string): string {
  return data.slice(0, 7)
}

/** Dia da semana (0=dom..6=sáb) de 'AAAA-MM-DD' — independente de fuso. */
export function diaDaSemana(data: string): number {
  const [a, m, d] = data.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

/** Soma dias a 'AAAA-MM-DD'. */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d + dias))
  return dt.toISOString().slice(0, 10)
}

/** Todas as datas de um mês 'AAAA-MM', opcionalmente só até `ate` (inclusive). */
export function datasDoMes(anoMes: string, ate?: string): string[] {
  const [a, m] = anoMes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  const out: string[] = []
  for (let d = 1; d <= ultimo; d++) {
    const data = `${anoMes}-${String(d).padStart(2, '0')}`
    if (ate && data > ate) break
    out.push(data)
  }
  return out
}

/** 'HH:MM' ou 'HH:MM:SS' (coluna time do Postgres) → minutos do dia. */
export function minutosDeHorario(horario: string): number {
  const [h, m] = horario.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** O dia `data` já está travado? (dia passado, ou hoje depois do fechamento) */
export function diaFechado(data: string, horarioFechamento: string, ref: Date = new Date()): boolean {
  const agora = agoraSP(ref)
  if (data < agora.data) return true
  if (data > agora.data) return false
  return agora.minutosDoDia >= minutosDeHorario(horarioFechamento)
}

/** Minutos até o fechamento de hoje (negativo se já passou). */
export function minutosParaFechamento(horarioFechamento: string, ref: Date = new Date()): number {
  return minutosDeHorario(horarioFechamento) - agoraSP(ref).minutosDoDia
}

/** '20:00:00' → '20h' ; '19:30:00' → '19h30' */
export function horarioCurto(horario: string): string {
  const [h, m] = horario.split(':')
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
}

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export const NOMES_DIAS_CURTOS = DIAS_CURTOS

/** '2026-11-12' → '12/11' */
export function dataCurta(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`
}

/** '2026-11-12' → 'quinta-feira, 12 de novembro' */
export function dataPorExtenso(data: string): string {
  const [, m, d] = data.split('-').map(Number)
  return `${DIAS_LONGOS[diaDaSemana(data)]}, ${d} de ${MESES[m - 1]}`
}

/** '2026-11' → 'novembro de 2026' */
export function mesPorExtenso(anoMes: string): string {
  const [a, m] = anoMes.split('-').map(Number)
  return `${MESES[m - 1]} de ${a}`
}

/** Mês anterior de 'AAAA-MM'. */
export function mesAnterior(anoMes: string): string {
  const [a, m] = anoMes.split('-').map(Number)
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`
}
