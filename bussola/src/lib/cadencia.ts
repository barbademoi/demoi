import { spNowParts, spWallToUtc, spPartsOf } from './tz'

export type Cadencia = 'diaria' | 'semanal' | 'quinzenal' | 'mensal'

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]
const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface CadenciaConfig {
  cadencia: Cadencia
  dia_reuniao: number | null      // 1..7 (segunda..domingo) — semanal/quinzenal
  hora_reuniao: string | null     // "HH:MM"
  dia_mes_reuniao: number | null  // 1..31 — mensal
  incluir_domingos: boolean       // diária
}

export interface ProximaReuniaoCalc {
  data: Date
  diaLabel: string
  horaLabel: string
  contagem: string
}

function diasNoMes(y: number, m: number): number {
  // m é 0-indexed (jan=0). Dia 0 do mês seguinte = último dia deste mês.
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
}

function diasEntre(de: Date, ate: Date): number {
  const a = spPartsOf(de), b = spPartsOf(ate)
  const ms = Date.UTC(b.y, b.m, b.day) - Date.UTC(a.y, a.m, a.day)
  return Math.round(ms / (24 * 60 * 60 * 1000))
}

function parseHora(hr: string | null): { h: number; mi: number } {
  const [h, mi] = (hr || '09:00').split(':').map((n) => parseInt(n, 10))
  return { h: Number.isNaN(h) ? 9 : h, mi: Number.isNaN(mi) ? 0 : mi }
}

function labelHora(h: number, mi: number): string {
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

// Próxima reunião conforme a cadência configurada.
// `ultimaConcluidaIso` é opcional, usado pra calcular quinzenal sequencial.
export function proximaReuniao(cfg: CadenciaConfig, ultimaConcluidaIso?: string | null): ProximaReuniaoCalc {
  const { h, mi } = parseHora(cfg.hora_reuniao)
  const horaLabel = labelHora(h, mi)
  const agora = new Date()
  const now = spNowParts()

  if (cfg.cadencia === 'diaria') {
    // Hoje se hora ainda não passou; senão amanhã. Pula domingo se incluir_domingos=false.
    let data = spWallToUtc(now.y, now.m, now.day, h, mi)
    if (data.getTime() <= agora.getTime()) {
      data = spWallToUtc(now.y, now.m, now.day + 1, h, mi)
    }
    if (!cfg.incluir_domingos) {
      let dp = spPartsOf(data)
      while (dp.dow === 0) {
        data = spWallToUtc(dp.y, dp.m, dp.day + 1, h, mi)
        dp = spPartsOf(data)
      }
    }
    const dias = diasEntre(agora, data)
    const horas = Math.max(0, Math.round((data.getTime() - agora.getTime()) / (60 * 60 * 1000)))
    const dp = spPartsOf(data)
    return {
      data,
      diaLabel: dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : DIAS_SEMANA[dp.dow],
      horaLabel,
      contagem: dias === 0 ? (horas <= 1 ? 'Em menos de 1h' : `Em ${horas}h`) : dias === 1 ? 'Amanhã' : `Em ${dias} dias`,
    }
  }

  if (cfg.cadencia === 'semanal' || cfg.cadencia === 'quinzenal') {
    const alvoDow = (cfg.dia_reuniao ?? 1) % 7 // 1..7→1..6,0 (seg..sáb, dom=0)
    let diff = (alvoDow - now.dow + 7) % 7
    let data = spWallToUtc(now.y, now.m, now.day + diff, h, mi)
    if (diff === 0 && data.getTime() <= agora.getTime()) {
      data = spWallToUtc(now.y, now.m, now.day + 7, h, mi)
      diff = 7
    }
    // Pra quinzenal: se já passou < 14 dias da última, joga +7 até dar ≥14.
    if (cfg.cadencia === 'quinzenal' && ultimaConcluidaIso) {
      const ult = new Date(ultimaConcluidaIso)
      while (data.getTime() - ult.getTime() < 14 * 24 * 60 * 60 * 1000) {
        const dp = spPartsOf(data)
        data = spWallToUtc(dp.y, dp.m, dp.day + 7, h, mi)
      }
    }
    const dias = diasEntre(agora, data)
    return {
      data,
      diaLabel: DIAS_SEMANA[alvoDow],
      horaLabel,
      contagem: dias === 0 ? 'Hoje!' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`,
    }
  }

  // mensal
  const diaAlvo = cfg.dia_mes_reuniao ?? 1
  // Tenta o mês atual.
  let y = now.y, m = now.m
  let diaUsado = Math.min(diaAlvo, diasNoMes(y, m))
  let data = spWallToUtc(y, m, diaUsado, h, mi)
  if (data.getTime() <= agora.getTime()) {
    // Próximo mês.
    m += 1
    if (m > 11) { m = 0; y += 1 }
    diaUsado = Math.min(diaAlvo, diasNoMes(y, m))
    data = spWallToUtc(y, m, diaUsado, h, mi)
  }
  const dias = diasEntre(agora, data)
  return {
    data,
    diaLabel: `${diaUsado}/${MESES_ABREV[m]}`,
    horaLabel,
    contagem: dias === 0 ? 'Hoje!' : dias === 1 ? 'Amanhã' : `Em ${dias} dias`,
  }
}

// Texto curto pra inline em frases: "esta semana", "hoje", etc.
export function labelPeriodo(c: Cadencia): string {
  switch (c) {
    case 'diaria': return 'hoje'
    case 'quinzenal': return 'nesta quinzena'
    case 'mensal': return 'este mês'
    case 'semanal':
    default: return 'esta semana'
  }
}

// Texto pra "próximo": "próxima diária", "próxima semana", etc.
export function labelProximoPeriodo(c: Cadencia): string {
  switch (c) {
    case 'diaria': return 'amanhã'
    case 'quinzenal': return 'próxima quinzena'
    case 'mensal': return 'próximo mês'
    case 'semanal':
    default: return 'próxima semana'
  }
}

// Texto pra "período anterior": "ontem", "semana passada", etc.
export function labelPeriodoAnterior(c: Cadencia): string {
  switch (c) {
    case 'diaria': return 'ontem'
    case 'quinzenal': return 'quinzena passada'
    case 'mensal': return 'mês passado'
    case 'semanal':
    default: return 'semana passada'
  }
}

// Nome da cadência pra UI ("Diária", "Semanal", ...).
export function nomeCadencia(c: Cadencia): string {
  switch (c) {
    case 'diaria': return 'Diária'
    case 'semanal': return 'Semanal'
    case 'quinzenal': return 'Quinzenal'
    case 'mensal': return 'Mensal'
  }
}
