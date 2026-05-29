// Regras fixas do sistema, válidas pra TODAS as campanhas, em TODAS as
// barbearias. Não são editáveis pelo dono — são o "contrato" da plataforma
// com os times. Combinados específicos da barbearia ficam em
// campanha.regras_personalizadas (texto livre).

export const REGRAS_FIXAS: readonly string[] = [
  'Pontos de assinatura vendida são válidos somente com comprovação de que o barbeiro ou recepcionista ofereceu ao cliente.',
  'Pontos de indicação de cliente novo têm validade somente quando o barbeiro ou recepcionista comprovarem a indicação.',
  'Números de vendas de serviços extras e produtos são válidos somente se estiverem exatamente iguais ao sistema principal de gestão da barbearia.',
  'Pontuação de marketing é válida somente se o barbeiro ou recepcionista marcarem a barbearia e o cliente no post.',
] as const
