/**
 * Cálculo de RITMO / PROJETADO com base nos DIAS DE TRABALHO do barbeiro.
 *
 * Contexto: o "esperado até hoje", o "ritmo necessário/dia" e a "previsão de
 * fechamento" precisavam ficar justos com quem folga mais. Antes a base eram
 * os dias úteis do ciclo (Seg–Sáb) — igual pra todo mundo. Agora, quando o
 * barbeiro (ou a barbearia) define quantos dias vai trabalhar no mês, a base
 * passa a ser esses dias de trabalho.
 *
 * A META TOTAL em R$ NÃO muda aqui — só o ritmo/esperado/projetado.
 *
 * Régua (simples, sem depender de qual dia da semana ele folga):
 *   fracaoCiclo            = dias_do_ciclo_ja_passados / total_dias_do_ciclo
 *   dias_trabalho_decorridos = dias_trabalho_no_mes * fracaoCiclo
 *   esperado_ate_hoje      = meta_total * (dias_trabalho_decorridos / dias_trabalho_no_mes)
 *                          = meta_total * fracaoCiclo
 * (distribui a meta proporcional ao andamento do ciclo, mas mantém a base em
 *  "dias de trabalho" pra evoluir depois pra folga por dia específico.)
 *
 * Se `diasTrabalhoMes` for null/0, cai no comportamento ANTIGO: base = dias
 * úteis do ciclo. Assim ninguém que já usa o sistema é afetado.
 */

export interface RitmoInput {
  /** Acumulado do barbeiro/equipe no ciclo (R$). */
  comissao: number
  /** Próxima meta a bater (R$). 0 = todas batidas ou sem meta. */
  metaFoco: number
  /** Andamento do ciclo em dias corridos (26→25): já passados e total. */
  diasCorridosCiclo: number
  totalDiasCiclo: number
  /** Dias de trabalho do barbeiro no mês. null/0 → usa dias úteis (legado). */
  diasTrabalhoMes: number | null
  /** Fallback legado: dias úteis do ciclo já decorridos e restantes. */
  diasUteisCorridos: number
  diasUteisRestantes: number
}

export interface RitmoResult {
  /** true = calculou pela base "dias de trabalho"; false = dias úteis (legado). */
  usaDiasTrabalho: boolean
  /** Dias da base já decorridos (pode ser fracionário no modo dias de trabalho). */
  baseDecorridos: number
  /** Dias da base restantes. */
  baseRestantes: number
  /** Total de dias da base no mês. */
  baseTotal: number
  /** R$ por dia da base já decorrido. */
  ritmoAtual: number
  /** R$ por dia da base restante pra bater a metaFoco. 0 se já bateu/sem meta. */
  necessarioPorDia: number
  /** R$ que o barbeiro "já deveria ter feito" até hoje pra estar no ritmo. */
  esperadoAteHoje: number
  /** Previsão de fechamento do mês, extrapolando o ritmo atual. */
  projetado: number
  /** true = está no ritmo (ou acima) pra bater a metaFoco. */
  ritmoOk: boolean
}

/**
 * Resolve os dias de trabalho efetivos: valor do barbeiro tem prioridade;
 * se vazio, herda o padrão da barbearia; se ambos vazios, retorna null
 * (→ comportamento legado por dias úteis).
 */
export function resolverDiasTrabalho(
  diasBarbeiro: number | null | undefined,
  padraoBarbearia: number | null | undefined,
): number | null {
  if (diasBarbeiro != null && diasBarbeiro > 0) return diasBarbeiro
  if (padraoBarbearia != null && padraoBarbearia > 0) return padraoBarbearia
  return null
}

export function calcularRitmo(input: RitmoInput): RitmoResult {
  const {
    comissao, metaFoco,
    diasCorridosCiclo, totalDiasCiclo,
    diasTrabalhoMes,
    diasUteisCorridos, diasUteisRestantes,
  } = input

  const temMetaAberta = metaFoco > comissao

  // ── Modo NOVO: base = dias de trabalho do barbeiro ───────────────────────
  if (diasTrabalhoMes != null && diasTrabalhoMes > 0 && totalDiasCiclo > 0) {
    const fracao = Math.min(1, Math.max(0, diasCorridosCiclo / totalDiasCiclo))
    const baseTotal = diasTrabalhoMes
    const baseDecorridos = baseTotal * fracao
    const baseRestantes = Math.max(0, baseTotal - baseDecorridos)

    const ritmoAtual = baseDecorridos > 0 ? comissao / baseDecorridos : 0
    const necessarioPorDia = baseRestantes > 0 && temMetaAberta
      ? (metaFoco - comissao) / baseRestantes
      : 0
    const esperadoAteHoje = metaFoco > 0 ? metaFoco * fracao : 0
    const projetado = fracao > 0 ? comissao / fracao : 0
    const ritmoOk = necessarioPorDia === 0 || ritmoAtual >= necessarioPorDia

    return {
      usaDiasTrabalho: true,
      baseDecorridos, baseRestantes, baseTotal,
      ritmoAtual, necessarioPorDia, esperadoAteHoje, projetado, ritmoOk,
    }
  }

  // ── Modo LEGADO: base = dias úteis do ciclo (comportamento atual) ─────────
  const baseTotal = diasUteisCorridos + diasUteisRestantes
  const ritmoAtual = diasUteisCorridos > 0 ? comissao / diasUteisCorridos : 0
  const necessarioPorDia = diasUteisRestantes > 0 && temMetaAberta
    ? (metaFoco - comissao) / diasUteisRestantes
    : 0
  const esperadoAteHoje = baseTotal > 0 && metaFoco > 0
    ? metaFoco * (diasUteisCorridos / baseTotal)
    : 0
  const projetado = diasUteisCorridos > 0 ? ritmoAtual * baseTotal : 0
  const ritmoOk = necessarioPorDia === 0 || ritmoAtual >= necessarioPorDia

  return {
    usaDiasTrabalho: false,
    baseDecorridos: diasUteisCorridos,
    baseRestantes: diasUteisRestantes,
    baseTotal,
    ritmoAtual, necessarioPorDia, esperadoAteHoje, projetado, ritmoOk,
  }
}
