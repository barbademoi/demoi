// Regras gerais da campanha. Há um default no sistema (REGRAS_FIXAS) usado
// como fallback quando a barbearia nunca editou. Quando o dono edita
// (CampanhaModal aba Regras), persiste em `barbearias.regras_gerais` e o
// helper `pegarRegrasGerais` passa a devolver o array do banco.
//
// Combinados específicos da barbearia (texto livre, observações soltas)
// ficam em campanha.regras_personalizadas — separados da lista.

export const REGRAS_FIXAS: readonly string[] = [
  'Pontos de assinatura vendida são válidos somente com comprovação de que o barbeiro ou recepcionista ofereceu ao cliente.',
  'Pontos de indicação de cliente novo têm validade somente quando o barbeiro ou recepcionista comprovarem a indicação.',
  'Números de vendas de serviços extras e produtos são válidos somente se estiverem exatamente iguais ao sistema principal de gestão da barbearia.',
  'Pontuação de marketing é válida somente se o barbeiro ou recepcionista marcarem a barbearia e o cliente no post.',
] as const

/**
 * Retorna as regras gerais ATIVAS pra exibição: as customizadas da barbearia
 * (se editou) ou o default do sistema. Quem chama deve passar o valor cru
 * de `barbearias.regras_gerais` (string[] | null).
 *
 * Convenção: array vazio ([]) significa "o dono apagou tudo de propósito"
 * e DEVE ser respeitado (lista vazia). Só `null` ou `undefined` cai no default.
 */
export function pegarRegrasGerais(regrasDb: string[] | null | undefined): readonly string[] {
  if (regrasDb === null || regrasDb === undefined) return REGRAS_FIXAS
  return regrasDb
}

