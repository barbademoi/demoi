// REGRAS DA EXCLUSÃO DEFINITIVA DE UM PROFISSIONAL.
//
// Desativar e excluir resolvem coisas diferentes. Desativar tira o barbeiro
// das telas e preserva tudo — é o certo para quem foi demitido, porque o que
// ele faturou continua sendo parte do histórico da barbearia. Excluir apaga o
// registro e, pelo cascade das chaves estrangeiras, tudo que estava pendurado
// nele: é o certo para um cadastro duplicado, um nome digitado errado, um
// teste que ficou.
//
// O que está aqui é o que decide se a exclusão pode acontecer e o que ela vai
// levar junto — a parte que, errada, apaga faturamento sem ninguém perceber.

/** Tabelas que o cascade leva junto, e como cada uma se chama para o dono. */
export const TABELAS_EM_CASCATA = [
  { tabela: 'lancamentos', rotulo: 'lançamentos de faturamento/comissão' },
  { tabela: 'lancamentos_diarios', rotulo: 'lançamentos diários' },
  { tabela: 'metas_individuais', rotulo: 'metas individuais' },
  { tabela: 'controle_diario', rotulo: 'registros de pontos' },
  { tabela: 'dias_sem_pontuacao', rotulo: 'dias sem pontuação' },
  { tabela: 'ocorrencias_conduta', rotulo: 'ocorrências de conduta' },
  { tabela: 'mensagens_conduta', rotulo: 'mensagens de conduta' },
  { tabela: 'celebracoes', rotulo: 'celebrações' },
  { tabela: 'mensagens_ia', rotulo: 'mensagens da IA' },
  { tabela: 'ajustes_comissao', rotulo: 'ajustes manuais de comissão' },
  { tabela: 'brindoleta_spins', rotulo: 'giros da Brindoleta' },
  { tabela: 'brindoleta_sales', rotulo: 'vendas da Brindoleta' },
] as const

export type TabelaEmCascata = (typeof TABELAS_EM_CASCATA)[number]['tabela']

/** Contagem por tabela do que a exclusão apagaria. */
export type Inventario = Partial<Record<TabelaEmCascata, number>>

export interface ItemInventario {
  tabela: TabelaEmCascata
  rotulo: string
  quantidade: number
}

/** Só o que tem alguma linha, do maior para o menor — o resto é ruído. */
export function itensDoInventario(inv: Inventario): ItemInventario[] {
  return TABELAS_EM_CASCATA
    .map((t) => ({ tabela: t.tabela, rotulo: t.rotulo, quantidade: Number(inv?.[t.tabela]) || 0 }))
    .filter((i) => i.quantidade > 0)
    .sort((a, b) => b.quantidade - a.quantidade)
}

export function totalDoInventario(inv: Inventario): number {
  return itensDoInventario(inv).reduce((s, i) => s + i.quantidade, 0)
}

/**
 * A confirmação por nome.
 *
 * Digitar o nome é a única barreira antes de algo irreversível, então ela não
 * pode ser frouxa a ponto de um Enter distraído passar, nem rígida a ponto de
 * um acento ou uma maiúscula reprovarem quem digitou certo. Compara sem
 * acento, sem caixa e sem espaço sobrando.
 */
export function confirmacaoConfere(digitado: string, nomeReal: string): boolean {
  const normaliza = (s: string) =>
    String(s ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().replace(/\s+/g, ' ')
      .toLowerCase()
  const alvo = normaliza(nomeReal)
  if (alvo === '') return false
  return normaliza(digitado) === alvo
}

export interface CicloComDado {
  mes: number
  ano: number
}

/**
 * A exclusão é permitida?
 *
 * O único bloqueio é MÊS FECHADO. O sistema inteiro trata um ciclo fechado
 * como imutável — lançamento diário, acumulado, edição de comissão bruta e o
 * import da extensão todos recusam escrever nele. Deixar uma exclusão apagar
 * lançamentos de um mês fechado abriria, pela porta dos fundos, o buraco que
 * todas as outras portas fecham: o faturamento de um mês já conferido mudaria
 * depois de conferido.
 *
 * Quem foi demitido depois de ter trabalhado meses fechados deve ser
 * DESATIVADO, que é exatamente o caso de uso da desativação.
 */
export function podeExcluir(fechadosComDado: CicloComDado[]): { ok: true } | { ok: false; motivo: string; ciclos: CicloComDado[] } {
  const ciclos = fechadosComDado ?? []
  if (ciclos.length === 0) return { ok: true }

  const lista = ciclos
    .slice()
    .sort((a, b) => a.ano - b.ano || a.mes - b.mes)
    .map((c) => `${String(c.mes).padStart(2, '0')}/${c.ano}`)
    .join(', ')

  return {
    ok: false,
    ciclos,
    motivo:
      `Este profissional tem lançamento em ${ciclos.length === 1 ? 'um mês fechado' : 'meses fechados'} (${lista}). ` +
      'Excluir mudaria o faturamento de um período já conferido. Use Desativar: ele sai das telas e o histórico fica intacto.',
  }
}
