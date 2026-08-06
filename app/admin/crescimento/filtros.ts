// Pisos de confiabilidade do painel de crescimento.
//
// Fica FORA de actions.ts porque aquele arquivo é 'use server', e um módulo
// server-action só pode exportar função async — constante exportada de lá
// quebra o build.

export type FiltrosCrescimento = {
  ciclos: number
  piso: number
  diasMinimos: number
  mesesMinimos: number
  outlierPct: number
}

/** Defaults do produto: 2 meses fechados, R$ 1.500/mês, 10 dias lançados. */
export const FILTROS_PADRAO: FiltrosCrescimento = {
  ciclos: 6,
  piso: 1500,
  diasMinimos: 10,
  mesesMinimos: 2,
  outlierPct: 300,
}

/** Mantém cada piso dentro de uma faixa sã — o valor vem da URL. */
export function sanearFiltros(f: Partial<FiltrosCrescimento>): FiltrosCrescimento {
  const num = (v: unknown, min: number, max: number, padrao: number) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= min && n <= max ? n : padrao
  }
  return {
    ciclos:       num(f.ciclos, 3, 12, FILTROS_PADRAO.ciclos),
    piso:         num(f.piso, 0, 100_000, FILTROS_PADRAO.piso),
    diasMinimos:  num(f.diasMinimos, 0, 31, FILTROS_PADRAO.diasMinimos),
    mesesMinimos: num(f.mesesMinimos, 2, 12, FILTROS_PADRAO.mesesMinimos),
    outlierPct:   num(f.outlierPct, 10, 100_000, FILTROS_PADRAO.outlierPct),
  }
}
