// LIBERACAO MANUAL vs EVENTO DE VENDA — a regra, separada pra poder ser testada.
//
// `financeiro_grants` e `feedback_grants` tem o e-mail como chave e uma coluna
// `source` que diz de onde o acesso veio: 'hotmart:PRODUTO/OFERTA' numa compra,
// 'manual:...' quando foi liberado na mao (a migration 040 gravou
// 'manual:backfill-plus-040' em varios clientes; a 029 documenta
// 'manual:suporte').
//
// O webhook fazia upsert cego: na chegada de reembolso, chargeback,
// cancelamento ou expiracao, gravava active=false em QUALQUER linha daquele
// e-mail — inclusive nas manuais. Bastava a pessoa pedir reembolso de um
// produto qualquer pra perder um acesso que ninguem vendeu a ela.

export function ehOrigemManual(source: unknown): boolean {
  return String(source ?? "").startsWith("manual:");
}

/**
 * A linha deve ser PRESERVADA (nao escrita) neste evento?
 *
 * - Aprovacao (`active = true`) nunca preserva: a compra so soma, e passa a ser
 *   a origem do acesso.
 * - Revogacao preserva a linha de origem manual.
 * - Revogacao com FALHA DE LEITURA tambem preserva. Na duvida nao se revoga:
 *   deixar um acesso a mais por um erro de rede e barato; tirar o acesso de
 *   quem recebeu na mao, nao.
 */
export function devePreservar(
  active: boolean,
  source: unknown,
  erroDeLeitura: boolean,
): boolean {
  if (active) return false;
  if (erroDeLeitura) return true;
  return ehOrigemManual(source);
}
