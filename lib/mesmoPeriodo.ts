/**
 * "MESMO PERÍODO DO MÊS PASSADO" — a régua compartilhada.
 *
 * Comparar o mês em andamento com o mês anterior INTEIRO é sempre injusto: no
 * dia 8 a barbearia está perdendo de lavada pra um mês de 31 dias que já
 * terminou. A régua honesta é comparar os mesmos dias decorridos.
 *
 * Estas duas funções nasceram duplicadas em `destaquesMes` e em
 * `reuniao/raioX` — mesma matemática, dois lugares. Ficam aqui pra que
 * exista UMA definição, e pra que o comparativo do dashboard use exatamente
 * a mesma, sem inventar um cálculo paralelo.
 *
 * O denominador do fator é o total de dias do CICLO ANTERIOR (não do atual):
 * é o mês anterior que está sendo fatiado, e ciclos têm 28, 29, 30 ou 31 dias.
 *
 * Fuso: quem chama passa `hoje` já em America/Sao_Paulo (`hojeBrasil()`).
 */

/**
 * Dias decorridos do ciclo contando o próprio dia de hoje (dia 1 = o primeiro
 * dia do ciclo). Zera as horas dos dois lados pra que a conta não dependa do
 * horário em que a página foi aberta.
 */
export function diasDecorridosInclusive(inicio: Date, hoje: Date): number {
  const a = new Date(inicio); a.setHours(0, 0, 0, 0)
  const b = new Date(hoje); b.setHours(0, 0, 0, 0)
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1
}

/**
 * Fração do ciclo anterior equivalente aos dias já decorridos do ciclo atual.
 * Teto em 1: um ciclo atual mais longo que o anterior não pode "colher" mais
 * do que o mês passado inteiro.
 */
export function fatorMesmoPeriodo(diasDecorridos: number, totalDiasCicloAnterior: number): number {
  if (totalDiasCicloAnterior <= 0) return 1
  return Math.min(1, diasDecorridos / totalDiasCicloAnterior)
}
