// Helpers de timezone para America/Sao_Paulo.
// O Brasil não adota horário de verão desde 2019, então usamos
// um offset fixo de UTC-3. Se isso voltar a mudar, é aqui que se ajusta.
const OFFSET_SP_MS = 3 * 60 * 60 * 1000

export interface PartesSP {
  y: number
  m: number // 0-11
  day: number
  dow: number // 0=domingo .. 6=sábado
  h: number
  min: number
}

function partes(d: Date): PartesSP {
  const sp = new Date(d.getTime() - OFFSET_SP_MS)
  return {
    y: sp.getUTCFullYear(),
    m: sp.getUTCMonth(),
    day: sp.getUTCDate(),
    dow: sp.getUTCDay(),
    h: sp.getUTCHours(),
    min: sp.getUTCMinutes(),
  }
}

// Componentes do "agora" no relógio de São Paulo.
export function spNowParts(): PartesSP {
  return partes(new Date())
}

// Componentes de uma data qualquer no relógio de São Paulo.
export function spPartsOf(d: Date): PartesSP {
  return partes(d)
}

// Converte um horário de parede de São Paulo para o instante UTC real.
export function spWallToUtc(
  y: number, m: number, day: number,
  h = 0, mi = 0, s = 0, ms = 0
): Date {
  return new Date(Date.UTC(y, m, day, h, mi, s, ms) + OFFSET_SP_MS)
}
