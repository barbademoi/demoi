/**
 * FRASES DA REUNIÃO — montadas por TEMPLATE, sem IA.
 *
 * O raio-x (lib/reuniao/raioX.ts) já apura todos os números: acumulado do
 * ciclo, mesmo período do mês anterior, projeção, quem precisa de atenção,
 * destaques. Aqui só se escolhe a palavra certa pro número que veio ("na
 * frente"/"atrás", "acima"/"abaixo", singular/plural) e se preenche o texto.
 *
 * Regra dura: NADA é recalculado aqui. Toda conta já vem pronta do raio-x —
 * as únicas operações são subtrair dois valores que o próprio raio-x apurou
 * (pra dizer a diferença em R$) e arredondar pra exibição. Assim o texto não
 * pode divergir dos cards da tela.
 */

import type { RaioXReuniao, BarbeiroRaioX } from './raioX'

const fmtBRL = (n: number) =>
  `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const pctInt = (n: number) => `${Math.abs(Math.round(n))}%`

/** Plural simples: 1 dia / 2 dias. */
const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur)

/**
 * Bloco 1 — RESUMO DO MÊS.
 * "Até hoje R$ A; no mesmo ponto de {mês passado}, R$ B — {na frente/atrás} por R$ dif."
 */
function blocoResumo(rx: RaioXReuniao): string {
  const linhas: string[] = []
  const base = rx.baseLabel.toLowerCase()

  linhas.push(
    `${cap(rx.cicloLabel)} está no dia ${rx.diasDecorridos} de ${rx.totalDiasCiclo}.`,
  )

  if (rx.totalDeltaPct == null || rx.totalMesmoPeriodoAnterior <= 0) {
    // Sem base anterior não existe "subiu" nem "caiu" — dizer 0% seria inventar.
    linhas.push(
      `Até hoje ${fmtBRL(rx.totalAtual)} de ${base}. Não há ${rx.cicloAnteriorLabel} pra comparar, então este mês vira a base das próximas comparações.`,
    )
  } else {
    const dif = rx.totalAtual - rx.totalMesmoPeriodoAnterior
    const naFrente = dif >= 0
    linhas.push(
      `Até hoje ${fmtBRL(rx.totalAtual)} de ${base}; no mesmo ponto de ${rx.cicloAnteriorLabel}, ` +
      `${fmtBRL(rx.totalMesmoPeriodoAnterior)} — ${naFrente ? 'na frente' : 'atrás'} por ` +
      `${fmtBRL(Math.abs(dif))} (${naFrente ? '+' : '-'}${pctInt(rx.totalDeltaPct)}).`,
    )
  }

  if (rx.totalProjetado > 0) {
    linhas.push(`Mantido o ritmo, o mês fecha em ${fmtBRL(rx.totalProjetado)}.`)
  }

  return linhas.join('\n')
}

/**
 * Bloco 2 — A CASA MÊS A MÊS (só quando o toggle de faturamento geral está on).
 * "{mes} fechou {X}% {acima/abaixo} de {mes_anterior} ({+/- R$ Y})."
 */
function blocoCasa(rx: RaioXReuniao): string | null {
  const meses = rx.faturamentoGeral
  if (!rx.mostrarFaturamentoGeral || !meses || !meses.some(m => m.valor > 0)) return null

  const linhas: string[] = []
  for (let i = 0; i < meses.length; i++) {
    const m = meses[i]
    if (m.valor <= 0) continue
    const anteriorLabel = i > 0 ? meses[i - 1].label : null

    if (m.deltaPct == null || m.valorAnteriorComparado == null || !anteriorLabel) {
      linhas.push(`- ${m.label}: ${fmtBRL(m.valor)}${m.emAndamento ? ' (mês em andamento)' : ''}.`)
      continue
    }

    // Diferença contra a MESMA base do %: no mês em andamento o raio-x compara
    // com o anterior prorrateado, não com o mês fechado inteiro.
    const dif = m.valor - m.valorAnteriorComparado
    const acima = dif >= 0
    const verbo = m.emAndamento ? 'está' : 'fechou'
    // A preposição vem junto do alvo pra não sair "de o mesmo ponto".
    const alvo = m.emAndamento ? `do mesmo ponto de ${anteriorLabel}` : `de ${anteriorLabel}`

    linhas.push(
      `- ${m.label} ${verbo} ${pctInt(m.deltaPct)} ${acima ? 'acima' : 'abaixo'} ${alvo} ` +
      `(${acima ? '+' : '-'}${fmtBRL(Math.abs(dif))})${m.emAndamento ? ' — mês em andamento' : ''}.`,
    )
  }

  if (linhas.length === 0) return null
  return `A CASA MÊS A MÊS\n${linhas.join('\n')}`
}

/**
 * Bloco 3 — PONTOS DE ATENÇÃO.
 * "{barbeiro} está R$ {X} abaixo do mesmo período do mês passado."
 */
function blocoAtencao(rx: RaioXReuniao): string {
  if (rx.precisamAtencao.length === 0) {
    return 'PONTOS DE ATENÇÃO\n- Ninguém em alerta neste período.'
  }

  const linhas = rx.precisamAtencao.map((b) => {
    const dif = b.valorAtual - b.valorMesmoPeriodoAnterior
    // Quem tem base anterior e caiu: a frase mais útil é o quanto caiu em R$.
    if (b.valorMesmoPeriodoAnterior > 0 && dif < 0) {
      return `- ${b.nome} está ${fmtBRL(Math.abs(dif))} abaixo do mesmo período de ${rx.cicloAnteriorLabel}` +
             `${b.deltaPct != null ? ` (-${pctInt(b.deltaPct)})` : ''}.`
    }
    // Quem entrou em alerta por ritmo/meta: usa o motivo que o raio-x já apurou.
    if (b.metaFoco > 0 && !b.ritmoOk) {
      return `- ${b.nome} está atrás do ritmo pra meta de ${fmtBRL(b.metaFoco)}: ` +
             `${fmtBRL(b.valorAtual)} até agora, projeção de ${fmtBRL(b.projetado)}.`
    }
    return `- ${b.nome}: ${b.motivoAtencao ?? 'precisa de atenção neste período.'}`
  })

  return `PONTOS DE ATENÇÃO\n${linhas.join('\n')}`
}

/** Bloco 4 — QUEM PUXA O TIME (destaques já apurados). */
function blocoDestaques(rx: RaioXReuniao): string | null {
  const d = rx.destaques
  const linhas: string[] = []
  if (d.pontuacao)   linhas.push(`- Mais pontos: ${d.pontuacao.nome} (${d.pontuacao.valorFmt}).`)
  if (d.faturamento) linhas.push(`- ${d.faturamentoLabel}: ${d.faturamento.nome} (${d.faturamento.valorFmt}).`)
  if (d.evolucao)    linhas.push(`- Maior evolução: ${d.evolucao.nome} (${d.evolucao.valorFmt} vs. o mesmo período).`)
  if (linhas.length === 0) return null
  return `QUEM PUXA O TIME\n${linhas.join('\n')}`
}

/**
 * Bloco 5 — SUGESTÕES DE PAUTA.
 * Catálogo escolhido pelo ESTADO dos números, não por sorteio: o que entra
 * depende de estar na frente ou atrás, de ter gente em alerta, de ter meta e
 * de ter campanha rodando.
 */
function blocoSugestoes(rx: RaioXReuniao): string {
  const s: string[] = []

  if (rx.precisamAtencao.length > 0) {
    const nomes = listar(rx.precisamAtencao.map(b => b.nome))
    s.push(`Conversar individualmente com ${nomes} — entender o que mudou e combinar uma ação até o fim do mês.`)
  }

  if (rx.totalDeltaPct != null && rx.totalDeltaPct < 0) {
    s.push(`O time está atrás do mesmo período de ${rx.cicloAnteriorLabel}. Definir uma meta de recuperação pros ${rx.totalDiasCiclo - rx.diasDecorridos} ${plural(rx.totalDiasCiclo - rx.diasDecorridos, 'dia restante', 'dias restantes')}.`)
  } else if (rx.totalDeltaPct != null && rx.totalDeltaPct > 0) {
    s.push(`Reconhecer o time pelo avanço sobre ${rx.cicloAnteriorLabel} e combinar o que manter até o fechamento.`)
  }

  const atrasDoRitmo = rx.barbeiros.filter(b => b.metaFoco > 0 && !b.ritmoOk && !b.precisaAtencao)
  if (atrasDoRitmo.length > 0) {
    s.push(`Revisar o ritmo de ${listar(atrasDoRitmo.map(b => b.nome))}: dá pra bater a meta, mas não no ritmo atual.`)
  }

  const temMeta = rx.barbeiros.some(b => b.metaFoco > 0)
  if (temMeta) s.push('Reler as metas de cada um e o que ganham ao bater — deixar claro quanto falta.')

  const temPontos = rx.barbeiros.some(b => b.pontos > 0)
  if (temPontos) s.push('Relembrar quais serviços pontuam na campanha e onde estão os pontos fáceis.')

  // Barbearia nova (sem base, sem meta, sem campanha) cairia com uma linha só —
  // e uma linha não é pauta. Completa com tópicos que valem em qualquer mês.
  const reserva = [
    'Abrir espaço pra equipe apontar travas do dia a dia (agenda, produto em falta, horário).',
    'Combinar o foco da semana: o que cada um vai priorizar até o próximo encontro.',
    'Conferir se todo mundo está lançando o dia em dia — número atrasado atrapalha a leitura do mês.',
  ]
  for (const t of reserva) {
    if (s.length >= 3) break
    if (!s.includes(t)) s.push(t)
  }

  // 3 a 5 tópicos: menos que isso não vira pauta, mais que isso não se conduz.
  const escolhidas = s.slice(0, 5)
  return `SUGESTÕES DE PAUTA\n${escolhidas.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
}

/** "A", "A e B", "A, B e C" */
function listar(nomes: string[]): string {
  if (nomes.length === 0) return ''
  if (nomes.length === 1) return nomes[0]
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

/**
 * Monta a pauta inteira da reunião a partir do raio-x. Função pura: mesmos
 * números, mesmo texto — sem rede, sem IA, sem variação entre execuções.
 */
export function montarPautaReuniao(rx: RaioXReuniao): string {
  const blocos: (string | null)[] = [
    `RESUMO DO MÊS\n${blocoResumo(rx)}`,
    blocoCasa(rx),
    blocoAtencao(rx),
    blocoDestaques(rx),
    blocoSugestoes(rx),
  ]
  return blocos.filter((b): b is string => !!b).join('\n\n')
}

/** Exportado só pra teste/reuso pontual. */
export type { BarbeiroRaioX }
