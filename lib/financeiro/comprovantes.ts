// Regras do lote de COMPROVANTES do mês (o .zip do Financeiro).
//
// Quem entra no zip e com que nome sai — separado do componente porque é a
// parte que precisa estar certa e não depende de navegador: o componente só
// rasteriza os PNGs e empacota.

/** Texto vira pedaço de nome de arquivo: sem acento, sem espaço, sem símbolo. */
export function slug(s: string): string {
  return String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'sem-nome'
}

export interface ColaboradorComprovante {
  name?: string
  type?: string
  amount?: number
  monthly?: Record<string, number>
}

/** O valor bruto do colaborador no mês, na mesma régua da tela. */
export function brutoDoMes(c: ColaboradorComprovante, ym: string): number {
  if (c?.type === 'comissao') return Number(c?.monthly?.[ym]) || 0
  return Number(c?.amount) || 0
}

/**
 * Nome do arquivo dentro do zip.
 *
 * Começa pelo mês em AAAA-MM porque assim os arquivos ordenam sozinhos por
 * período no gerenciador de arquivos; depois vêm nome e tipo de lançamento,
 * pra o dono achar um comprovante específico sem abrir um por um:
 *   2026-09_maria-silva_comissao.png
 */
export function nomeArquivoComprovante(c: ColaboradorComprovante, ym: string): string {
  return `${ym}_${slug(c?.name ?? '')}_${c?.type === 'comissao' ? 'comissao' : 'salario'}`
}

/**
 * Quem entra no lote do mês.
 *
 * Só quem tem valor: colaborador cadastrado que ainda não teve comissão
 * lançada não vira um comprovante de R$ 0,00 no meio do pacote. A ausência
 * dele não é erro — o lote segue com o resto, que é o pedido de "não quebrar
 * quando falta comprovante".
 *
 * `liquido` entra na conta porque um colaborador pode ter bruto zerado e
 * ainda assim ter bônus a receber no mês; esse tem comprovante pra emitir.
 */
export function selecionarParaZip<T extends ColaboradorComprovante>(
  colaboradores: T[],
  ym: string,
  liquidoDoMes: (c: T, ym: string) => number,
): T[] {
  return (colaboradores ?? []).filter(
    (c) => brutoDoMes(c, ym) > 0 || liquidoDoMes(c, ym) > 0,
  )
}

/** Nome do zip: identifica barbearia e período sem depender da pasta onde caiu. */
export function nomeArquivoZip(barbeariaNome: string, ym: string): string {
  return `comprovantes-${slug(barbeariaNome || 'barbearia')}-${ym}.zip`
}
