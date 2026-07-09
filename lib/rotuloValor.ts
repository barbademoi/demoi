// Rótulos dinâmicos do "número principal" conforme o modo da barbearia
// (faturamento / comissão / os dois). Só texto — não muda cálculo/meta/ranking.

export type ModoMeta = 'faturamento' | 'comissao' | 'ambos'
export type BaseMeta = 'faturamento' | 'comissao'

// Base efetiva do número principal: nos modos simples é o próprio modo; em
// "ambos" é a base_meta (o valor que conta pra meta/ranking).
export function baseEfetiva(modo: ModoMeta | null | undefined, base: BaseMeta | null | undefined): BaseMeta {
  const m = modo ?? 'comissao'
  if (m === 'ambos') return base ?? 'comissao'
  return m
}

// Substantivo: "Faturamento" | "Comissão".
export function nomeValor(modo: ModoMeta | null | undefined, base?: BaseMeta | null): string {
  return baseEfetiva(modo, base) === 'faturamento' ? 'Faturamento' : 'Comissão'
}

// Rótulo do acumulado com concordância: "Faturamento acumulado" | "Comissão acumulada".
export function rotuloAcumulado(modo: ModoMeta | null | undefined, base?: BaseMeta | null): string {
  return baseEfetiva(modo, base) === 'faturamento' ? 'Faturamento acumulado' : 'Comissão acumulada'
}
