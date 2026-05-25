import { spNowParts, spWallToUtc, spPartsOf } from './tz'
import { calcularPlacar, type Feedback } from './feedbacks'

const MES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000

export interface PontoSemana {
  inicio: Date
  fim: Date
  label: string
  valor: number
  positivos: number
  atual: boolean
}

// Placar (e nº de elogios) por semana, das últimas N semanas (mais antiga → atual).
export function evolucaoSemanal(feedbacks: Feedback[], nSemanas = 8): PontoSemana[] {
  const { y, m, day, dow } = spNowParts()
  const desdeSegunda = (dow + 6) % 7
  const segundaAtual = spWallToUtc(y, m, day - desdeSegunda, 0, 0, 0, 0)

  const pontos: PontoSemana[] = []
  for (let i = nSemanas - 1; i >= 0; i--) {
    const inicio = new Date(segundaAtual.getTime() - i * SEMANA_MS)
    const fim = new Date(inicio.getTime() + SEMANA_MS - 1)
    const naSemana = feedbacks.filter((f) => {
      const t = new Date(f.created_at).getTime()
      return t >= inicio.getTime() && t <= fim.getTime()
    })
    const sp = spPartsOf(inicio)
    pontos.push({
      inicio,
      fim,
      label: `${sp.day}/${MES_ABREV[sp.m]}`,
      valor: calcularPlacar(naSemana),
      positivos: naSemana.filter((f) => f.tipo === 'positivo').length,
      atual: i === 0,
    })
  }
  return pontos
}
