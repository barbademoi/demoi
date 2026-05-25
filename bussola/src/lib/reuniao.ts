import { spNowParts, spPartsOf, spWallToUtc } from './tz'

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

export interface ProximaReuniao {
  data: Date
  diaLabel: string
  horaLabel: string
  contagem: string // "Hoje!" | "Amanhã" | "Faltam X dias"
}

// dia_reuniao: 1=Segunda … 6=Sábado (7=Domingo, se usado). hora_reuniao: "HH:MM[:SS]".
export function proximaReuniao(diaReuniao: number, horaReuniao: string): ProximaReuniao {
  const [h, mi] = (horaReuniao || '09:00').split(':').map((n) => parseInt(n, 10))
  const alvoDow = diaReuniao % 7 // 7→0 (domingo), 1..6 mantêm (seg..sáb na convenção JS)

  const now = spNowParts()
  let diff = (alvoDow - now.dow + 7) % 7

  let data = spWallToUtc(now.y, now.m, now.day + diff, h, mi || 0)
  // Se é hoje mas o horário já passou, joga pra próxima semana.
  if (diff === 0 && data.getTime() <= Date.now()) {
    data = spWallToUtc(now.y, now.m, now.day + 7, h, mi || 0)
    diff = 7
  }

  const rp = spPartsOf(data)
  const hojeUTC = Date.UTC(now.y, now.m, now.day)
  const diaUTC = Date.UTC(rp.y, rp.m, rp.day)
  const dias = Math.round((diaUTC - hojeUTC) / (24 * 60 * 60 * 1000))

  const contagem = dias === 0 ? 'Hoje!' : dias === 1 ? 'Amanhã' : `Faltam ${dias} dias`
  const horaLabel = `${String(h).padStart(2, '0')}:${String(mi || 0).padStart(2, '0')}`

  return {
    data,
    diaLabel: DIAS_SEMANA[alvoDow],
    horaLabel,
    contagem,
  }
}
