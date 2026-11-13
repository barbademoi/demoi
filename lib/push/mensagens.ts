/**
 * AS FRASES DAS NOTIFICAÇÕES.
 *
 * Separadas da regra de quando enviar de propósito: mudar um texto é a coisa
 * que mais vai acontecer aqui, e não pode exigir mexer em lógica de horário.
 *
 * ── COMO ESTÃO ESCRITAS ─────────────────────────────────────────────────────
 * Notificação é lida na tela de bloqueio, de relance, por alguém que está
 * atendendo. Então:
 *   - o TÍTULO carrega o número ou o fato. Se a pessoa só ler o título, já
 *     soube o que importa;
 *   - o corpo diz o que fazer, numa frase;
 *   - nada de "Olá!", "Lembrete:", nome do sistema. O ícone já diz de quem é;
 *   - o lembrete que repete MUDA de texto a cada hora. Três vezes a mesma
 *     frase é o caminho mais curto pra pessoa desligar tudo.
 *
 * ── TOM ─────────────────────────────────────────────────────────────────────
 * Quem recebe é dono de barbearia e barbeiro, muitos de pé, no meio do
 * expediente. Direto, em português de gente, sem exclamação em tudo e sem
 * cobrança moral. O lembrete das 22h não briga: ele lembra que o dia ainda dá
 * pra fechar.
 */

export interface Mensagem {
  titulo: string
  corpo: string
  /** Pra onde o clique leva. Caminho relativo. */
  url: string
  /** Agrupa na bandeja: um aviso novo do mesmo assunto substitui o anterior. */
  tag: string
}

const reais = (v: number) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`

const plural = (n: number, um: string, muitos: string) =>
  `${n} ${n === 1 ? um : muitos}`

// ── DONO ────────────────────────────────────────────────────────────────────

/**
 * Um barbeiro lançou a pontuação dele. Evento, não lembrete: sai na hora em
 * que acontece e não repete.
 */
export function donoBarbeiroPontuou(nome: string, pontos: number, total: number | null): Mensagem {
  return {
    titulo: `${nome} lançou ${plural(pontos, 'ponto', 'pontos')} hoje`,
    corpo: total != null
      ? `Já são ${plural(total, 'ponto', 'pontos')} dele no mês. Confira na conferência de pontos.`
      : 'Confira na conferência de pontos.',
    url: '/dashboard/relatorio-pontos',
    tag: 'pontos-equipe',
  }
}

/**
 * Lembrete do lançamento diário, das 18h às 23h.
 *
 * O texto muda a cada hora. O das 18h avisa; o das 20h explica o custo; o das
 * 22h e 23h encurtam, porque a essa altura a pessoa está fechando a casa e o
 * que resta é um empurrão de dez segundos.
 */
export function donoLancamentoDiario(hora: number, diasSeguidos: number): Mensagem {
  const url = '/dashboard/lancamento-diario'
  const tag = 'lancamento-diario'

  if (hora >= 23) {
    return { titulo: 'Último lembrete de hoje', corpo: 'Dois minutos agora e o dia fecha certo. Depois da meia-noite vira dia esquecido.', url, tag }
  }
  if (hora >= 22) {
    return { titulo: 'O dia ainda não foi lançado', corpo: 'Antes de fechar a casa: lance o dia e pode dormir tranquilo.', url, tag }
  }
  if (hora >= 21) {
    return {
      titulo: diasSeguidos > 1 ? `${diasSeguidos} dias sem lançamento` : 'Faltou o lançamento de hoje',
      corpo: diasSeguidos > 1
        ? 'Dá pra lançar os dias anteriores também — o sistema acerta os números sozinho depois.'
        : 'Leva dois minutos e deixa a projeção e o ranking certos.',
      url, tag,
    }
  }
  if (hora >= 20) {
    return { titulo: 'Seu dia ainda está em branco', corpo: 'Meta, ranking e projeção saem do que você lança. Dia sem lançamento desarruma os três.', url, tag }
  }
  if (hora >= 19) {
    return { titulo: 'Lançamento de hoje ainda não entrou', corpo: 'Enquanto está fresco na cabeça: lance o faturamento e a comissão do dia.', url, tag }
  }
  return { titulo: 'Hora de lançar o dia', corpo: 'Fechou o expediente? Lance o faturamento e a comissão enquanto o movimento está fresco.', url, tag }
}

/**
 * Meta do mês que vem, do dia 25 até o fim do mês.
 *
 * O texto aperta conforme o mês acaba — mas o que ele diz é sempre a mesma
 * verdade: meta cadastrada depois que o mês começou é meta que a equipe não
 * teve tempo de perseguir.
 */
export function donoMetasProximoMes(nomeMes: string, diasRestantes: number): Mensagem {
  const url = '/dashboard'
  const tag = 'metas-proximo-mes'

  if (diasRestantes <= 1) {
    return { titulo: `${nomeMes} começa amanhã, sem meta`, corpo: 'A equipe acorda amanhã sem saber o que perseguir. Dá tempo de cadastrar hoje.', url, tag }
  }
  if (diasRestantes <= 3) {
    return { titulo: `Faltam ${plural(diasRestantes, 'dia', 'dias')} pra ${nomeMes}`, corpo: 'A meta de cada barbeiro ainda não está no sistema. Cadastre antes de virar o mês.', url, tag }
  }
  return { titulo: `Hora de montar a meta de ${nomeMes}`, corpo: 'Meta cadastrada antes do dia 1 é meta que a equipe persegue o mês inteiro.', url, tag }
}

// ── COLABORADOR ─────────────────────────────────────────────────────────────

/** Lembrete do lançamento de pontos, das 18h às 23h, só em mês com campanha. */
export function barbeiroLancarPontos(
  hora: number,
  link: string,
  faltamPontos: number | null,
): Mensagem {
  const url = `/b/${link}`
  const tag = 'lancar-pontos'

  if (hora >= 23) {
    return { titulo: 'Último lembrete de hoje', corpo: 'Lance os pontos do dia antes de virar — depois da meia-noite o dia fecha sem eles.', url, tag }
  }
  if (hora >= 21) {
    return {
      titulo: 'Seus pontos de hoje ainda não entraram',
      corpo: faltamPontos != null && faltamPontos > 0
        ? `Faltam ${plural(faltamPontos, 'ponto', 'pontos')} pro seu prêmio. Os de hoje contam.`
        : 'Ponto não lançado é ponto que não conta no prêmio.',
      url, tag,
    }
  }
  if (hora >= 19) {
    return { titulo: 'Lance os pontos do dia', corpo: 'Enquanto lembra de cada atendimento: registre o que você fez hoje.', url, tag }
  }
  return { titulo: 'Hora de lançar seus pontos', corpo: 'Terminou o expediente? Registre os serviços do dia e garanta a pontuação.', url, tag }
}

/**
 * Oferecer serviço extra. Sai de manhã, antes do movimento — lembrar à noite
 * de oferecer algo durante o dia não serve pra nada.
 */
export function barbeiroServicoExtra(link: string, servico: string | null, pontos: number | null): Mensagem {
  return {
    titulo: servico ? `Ofereça ${servico} hoje` : 'Ofereça um serviço extra hoje',
    corpo: pontos && pontos > 0
      ? `Cada um vale ${plural(pontos, 'ponto', 'pontos')}. Dois ou três no dia já mudam sua posição no ranking.`
      : 'Uma pergunta no fim do corte vira ponto, comissão e cliente mais satisfeito.',
    url: `/b/${link}`,
    tag: 'servico-extra',
  }
}

/** Quantos pontos faltam pra bater. Uma vez por dia, no fim da tarde. */
export function barbeiroPontosFaltando(
  link: string,
  faltam: number,
  diasRestantes: number,
  premio: string | null,
): Mensagem {
  const porDia = diasRestantes > 0 ? Math.ceil(faltam / diasRestantes) : faltam
  return {
    titulo: `Faltam ${plural(faltam, 'ponto', 'pontos')}${premio ? ` pro ${premio}` : ''}`,
    corpo: diasRestantes > 0
      ? `São ${plural(porDia, 'ponto', 'pontos')} por dia nos ${plural(diasRestantes, 'dia que resta', 'dias que restam')}. Dá.`
      : 'Último dia do ciclo — o que entrar hoje ainda conta.',
    url: `/b/${link}`,
    tag: 'pontos-faltando',
  }
}

/** Bateu a meta de pontos. Sai uma vez, no dia em que bate. */
export function barbeiroBateuPontos(link: string, premio: string | null): Mensagem {
  return {
    titulo: premio ? `Você garantiu: ${premio}` : 'Meta de pontos batida',
    corpo: 'Chegou na pontuação do mês. Daqui pra frente é vantagem — e o ranking ainda pode subir.',
    url: `/b/${link}`,
    tag: 'pontos-faltando',
  }
}

/** Comissão atual. Resumo do fim de tarde, uma vez por dia. */
export function barbeiroComissaoAtual(link: string, comissao: number, faltaMeta: number | null): Mensagem {
  return {
    titulo: `Sua comissão no mês: ${reais(comissao)}`,
    corpo: faltaMeta != null && faltaMeta > 0
      ? `Faltam ${reais(faltaMeta)} pra sua meta.`
      : faltaMeta != null
        ? 'Meta do mês batida. O que vier agora é a mais.'
        : 'Acompanhe o detalhe no seu link.',
    url: `/b/${link}`,
    tag: 'comissao',
  }
}

/** O dono lançou o dia. Evento: o barbeiro vê o número dele atualizado. */
export function barbeiroDonoLancou(link: string, comissaoDoDia: number | null): Mensagem {
  return {
    titulo: 'O dono lançou o dia',
    corpo: comissaoDoDia != null && comissaoDoDia > 0
      ? `Entraram ${reais(comissaoDoDia)} na sua comissão. Confira.`
      : 'Seus números do dia já estão atualizados. Confira.',
    url: `/b/${link}`,
    tag: 'dono-lancou',
  }
}

/**
 * Acima ou abaixo do mesmo ponto do mês passado. Semanal — diário viraria
 * ruído, e a comparação quase não muda de um dia pro outro.
 */
export function barbeiroComparativo(
  link: string,
  diferenca: number,
  labelAnterior: string,
): Mensagem {
  const aFrente = diferenca > 0
  const url = `/b/${link}`
  const tag = 'comparativo'

  if (Math.abs(diferenca) < 1) {
    return { titulo: `Empatado com ${labelAnterior}`, corpo: `No mesmo ponto do mês passado você estava no mesmo lugar. Esta semana desempata.`, url, tag }
  }
  return aFrente
    ? {
      titulo: `${reais(diferenca)} à frente de ${labelAnterior}`,
      corpo: `No mesmo ponto do mês passado você tinha menos. Segue assim.`,
      url, tag,
    }
    : {
      titulo: `${reais(Math.abs(diferenca))} atrás de ${labelAnterior}`,
      corpo: `É o que falta pra empatar com o mesmo ponto do mês passado. Ainda dá tempo.`,
      url, tag,
    }
}
