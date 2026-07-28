import { valorBase, type BaseMeta, type ModoMeta } from '@/lib/modoMeta'

export interface ConfiguracaoValores {
  modoMeta: ModoMeta
  baseMeta: BaseMeta
}

export interface ValoresAtuais {
  comissao_acumulada: number | string | null
  valor_faturamento: number | string | null
  valor_comissao: number | string | null
}

type SupabaseLike = {
  from: (tabela: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Fonte única da regra que decide qual valor alimenta meta/ranking. */
export async function buscarConfiguracaoValores(
  supabase: SupabaseLike,
  barbeariaId: string,
): Promise<ConfiguracaoValores> {
  const { data } = await supabase
    .from('barbearias')
    .select('modo_meta, base_meta')
    .eq('id', barbeariaId)
    .single()

  const modoMeta = (data?.modo_meta ?? 'comissao') as ModoMeta
  return {
    modoMeta,
    baseMeta: valorBase(modoMeta, data?.base_meta as BaseMeta | null),
  }
}

/**
 * Resolve o valor específico preservando compatibilidade com registros antigos,
 * que só possuíam `comissao_acumulada` como espelho da base.
 */
export function valorAtualDoTipo(
  atual: ValoresAtuais | null | undefined,
  tipo: BaseMeta,
  baseMeta: BaseMeta,
): number {
  if (!atual) return 0
  const especifico = tipo === 'faturamento'
    ? atual.valor_faturamento
    : atual.valor_comissao
  if (especifico != null) return Number(especifico) || 0
  return tipo === baseMeta ? (Number(atual.comissao_acumulada) || 0) : 0
}

/**
 * Monta as colunas monetárias de `lancamentos`. Usado tanto pelo formulário
 * manual quanto pela importação para não criar duas regras de espelhamento.
 */
export function montarPatchValores(
  valorFaturamento: number | null,
  valorComissao: number | null,
  baseMeta: BaseMeta,
): Record<string, number> {
  const patch: Record<string, number> = {}
  const fat = valorFaturamento != null ? Math.max(0, valorFaturamento) : null
  const com = valorComissao != null ? Math.max(0, valorComissao) : null
  if (fat != null) patch.valor_faturamento = fat
  if (com != null) patch.valor_comissao = com
  const espelho = baseMeta === 'faturamento' ? fat : com
  if (espelho != null) patch.comissao_acumulada = espelho
  return patch
}
