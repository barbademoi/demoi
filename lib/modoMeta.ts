// Helpers para o "modo de acompanhamento de meta" da barbearia.
// O dono escolhe entre: faturamento | comissao | ambos.
// Quando 'ambos', base_meta define qual dos dois valores alimenta meta/ranking.

export type ModoMeta = 'faturamento' | 'comissao' | 'ambos'
export type BaseMeta = 'faturamento' | 'comissao'

/** Qual valor (faturamento/comissao) e' a chave de meta/ranking neste modo. */
export function valorBase(
  modoMeta: ModoMeta | null | undefined,
  baseMeta: BaseMeta | null | undefined,
): BaseMeta {
  const modo = modoMeta ?? 'comissao'
  if (modo === 'faturamento') return 'faturamento'
  if (modo === 'comissao') return 'comissao'
  return (baseMeta ?? 'comissao')
}

/** Label singular do valor base — "Faturamento" ou "Comissão". */
export function labelBase(
  modoMeta: ModoMeta | null | undefined,
  baseMeta: BaseMeta | null | undefined,
): 'Faturamento' | 'Comissão' {
  return valorBase(modoMeta, baseMeta) === 'faturamento' ? 'Faturamento' : 'Comissão'
}

export function mostraFaturamento(modoMeta: ModoMeta | null | undefined): boolean {
  const m = modoMeta ?? 'comissao'
  return m === 'faturamento' || m === 'ambos'
}

export function mostraComissao(modoMeta: ModoMeta | null | undefined): boolean {
  const m = modoMeta ?? 'comissao'
  return m === 'comissao' || m === 'ambos'
}
