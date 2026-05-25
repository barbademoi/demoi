import { spNowParts, spWallToUtc } from './tz'

export type NomePeriodo = 'semana' | 'mes' | 'ano'

export interface Intervalo {
  inicio: Date
  fim: Date
}

const DIA_MS = 24 * 60 * 60 * 1000

// Intervalo do período corrente no fuso de São Paulo.
export function intervalo(periodo: NomePeriodo): Intervalo {
  const { y, m, day, dow } = spNowParts()

  if (periodo === 'semana') {
    const desdeSegunda = (dow + 6) % 7 // dom=6, seg=0, ...
    return {
      inicio: spWallToUtc(y, m, day - desdeSegunda, 0, 0, 0, 0),
      fim: spWallToUtc(y, m, day - desdeSegunda + 6, 23, 59, 59, 999),
    }
  }

  if (periodo === 'mes') {
    return {
      inicio: spWallToUtc(y, m, 1, 0, 0, 0, 0),
      fim: spWallToUtc(y, m + 1, 0, 23, 59, 59, 999),
    }
  }

  // ano
  return {
    inicio: spWallToUtc(y, 0, 1, 0, 0, 0, 0),
    fim: spWallToUtc(y, 11, 31, 23, 59, 59, 999),
  }
}

// Intervalo do período anterior (semana passada, mês passado, ano passado).
export function intervaloAnterior(periodo: NomePeriodo): Intervalo {
  const atual = intervalo(periodo)

  if (periodo === 'semana') {
    return {
      inicio: new Date(atual.inicio.getTime() - 7 * DIA_MS),
      fim: new Date(atual.fim.getTime() - 7 * DIA_MS),
    }
  }

  const { y, m } = spNowParts()
  if (periodo === 'mes') {
    return {
      inicio: spWallToUtc(y, m - 1, 1, 0, 0, 0, 0),
      fim: spWallToUtc(y, m, 0, 23, 59, 59, 999),
    }
  }

  return {
    inicio: spWallToUtc(y - 1, 0, 1, 0, 0, 0, 0),
    fim: spWallToUtc(y - 1, 11, 31, 23, 59, 59, 999),
  }
}
