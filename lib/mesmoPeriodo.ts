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
 * ── O QUE ESTAVA ERRADO NO FATOR ────────────────────────────────────────────
 * O denominador era o total do ciclo ANTERIOR, e hoje contava como dia
 * decorrido. No dia 31 de outubro contra um setembro de 30 dias isso dava
 * `min(1, 31/30) = 1`: o card dizia "no mesmo ponto de set" e mostrava
 * setembro INTEIRO, o mesmo número que "set fechou em". Dois valores idênticos
 * na mesma tela, com o dia de hoje ainda pela frente.
 *
 * Agora o fator é o ANDAMENTO do ciclo atual — dias já FECHADOS dele sobre o
 * tamanho dele —, e essa fração é aplicada ao ciclo anterior. Hoje só entra
 * depois da virada, porque hoje ainda está acontecendo. Assim a fatia do mês
 * passado só chega a 100% quando o mês atual também chegou.
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
 * Fração do ciclo ANTERIOR equivalente ao andamento do ciclo atual.
 *
 * Parâmetro nomeado de propósito: a versão antiga recebia dois números soltos
 * e o segundo era o total do ciclo ANTERIOR. Trocar o significado mantendo
 * `(number, number)` deixaria as chamadas antigas compilando com a conta
 * errada — e essa conta é a que estava produzindo o defeito.
 */
export function fatorMesmoPeriodo(p: {
  /** Dias decorridos CONTANDO hoje — o que `diasDecorridosInclusive` devolve. */
  decorridosInclusive: number
  /** Total de dias do ciclo ATUAL: é ele que define o andamento. */
  totalDoCiclo: number
}): number {
  if (p.totalDoCiclo <= 0) return 1
  // Hoje não está fechado, então não é um dia decorrido. Piso em 1 pra que o
  // primeiro dia do ciclo ainda compare com algo.
  const fechados = Math.max(1, p.decorridosInclusive - 1)
  return Math.min(1, fechados / p.totalDoCiclo)
}
