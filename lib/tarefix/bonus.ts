import type { NivelBonus } from '@/lib/tarefix/tipos'

/** Níveis válidos, em ordem crescente de percentual. */
export function niveisOrdenados(niveis: unknown): NivelBonus[] {
  if (!Array.isArray(niveis)) return []
  return niveis
    .filter((n): n is NivelBonus => n && typeof n.percentual === 'number' && typeof n.premio === 'string' && n.premio.trim() !== '')
    .map((n) => ({ percentual: Math.max(0, Math.min(100, Math.round(n.percentual))), premio: n.premio.trim() }))
    .sort((a, b) => a.percentual - b.percentual)
}

/** Maior nível alcançado com o percentual (ou null). */
export function nivelAtingido(niveis: NivelBonus[], percentual: number | null): NivelBonus | null {
  if (percentual === null) return null
  let melhor: NivelBonus | null = null
  for (const n of niveis) if (percentual >= n.percentual) melhor = n
  return melhor
}

/** Próximo nível ainda não alcançado (ou null). */
export function proximoNivel(niveis: NivelBonus[], percentual: number | null): NivelBonus | null {
  const p = percentual ?? 0
  return niveis.find((n) => p < n.percentual) ?? null
}

export type SituacaoBonus = {
  niveis: NivelBonus[]
  atingido: NivelBonus | null
  proximo: NivelBonus | null
  falta: number | null // pontos percentuais até o próximo
}

export function situacaoBonus(niveis: NivelBonus[], percentual: number | null): SituacaoBonus {
  const proximo = proximoNivel(niveis, percentual)
  return {
    niveis,
    atingido: nivelAtingido(niveis, percentual),
    proximo,
    falta: proximo ? proximo.percentual - (percentual ?? 0) : null,
  }
}
