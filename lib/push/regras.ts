/**
 * QUANDO MANDAR CADA NOTIFICAÇÃO — lógica pura, sem I/O.
 *
 * Recebe uma fotografia do estado (hora, ciclo, o que foi lançado, o que foi
 * configurado) e devolve a lista do que deve sair AGORA. Não lê banco, não
 * envia nada, não sabe o que é um push.
 *
 * ── O AGENDADOR É BURRO DE PROPÓSITO ────────────────────────────────────────
 * Ele roda de hora em hora e reavalia TUDO do zero. Não há fila, não há
 * "agendado pra tal hora", não há estado a manter entre execuções. Se uma
 * execução falhar, a próxima resolve; se rodar duas vezes, nada sai dobrado —
 * `marco` e o unique de `push_enviadas` cuidam disso.
 *
 * Isso é deliberado. Um agendador com estado próprio teria dois lugares
 * dizendo o que ainda falta fazer (ele e o banco), e eles divergiriam no
 * primeiro erro de rede.
 *
 * ── "FEZ A TAREFA, PARA DE MANDAR" ──────────────────────────────────────────
 * Não existe "cancelar o lembrete". O lembrete simplesmente não é gerado na
 * hora seguinte, porque a condição que o gerava deixou de ser verdade. Lançou
 * o dia? `lancouHoje` vira true e o lembrete some sozinho — inclusive se a
 * pessoa lançar pelo computador, por outro aparelho ou por importação.
 *
 * ── HORÁRIOS ────────────────────────────────────────────────────────────────
 * Tudo em America/Sao_Paulo, como o resto do sistema. Quem chama converte.
 */

import * as msg from './mensagens'
import type { Mensagem } from './mensagens'

/** Primeira e última hora dos lembretes que repetem. */
export const HORA_INICIO_LEMBRETE = 18
export const HORA_FIM_LEMBRETE = 23
/** O lembrete de oferecer serviço extra sai cedo, antes do movimento. */
export const HORA_SERVICO_EXTRA = 10
/** O resumo do dia (comissão, pontos que faltam) sai no fim da tarde. */
export const HORA_RESUMO = 17
/** Dia do mês em que a cobrança da meta do mês seguinte começa. */
export const DIA_COBRANCA_METAS = 25

export type TipoAviso =
  | 'lancamento-diario'
  | 'metas-proximo-mes'
  | 'lancar-pontos'
  | 'servico-extra'
  | 'pontos-faltando'
  | 'comissao-atual'
  | 'comparativo'

export interface Aviso {
  /** 'dono:<uuid>' ou 'barbeiro:<uuid>'. */
  destino: string
  tipo: TipoAviso
  /** Identifica este envio por inteiro, janela de tempo incluída. */
  marco: string
  mensagem: Mensagem
}

/** O "agora", já no fuso de São Paulo. */
export interface Agora {
  /** 'AAAA-MM-DD' em São Paulo. */
  dia: string
  /** 0..23 em São Paulo. */
  hora: number
  /** 0 = domingo … 6 = sábado. */
  diaDaSemana: number
  /** Dia do mês (1..31). */
  diaDoMes: number
  /** Dias que faltam até o fim do mês de calendário, hoje incluído. */
  diasAteFimDoMes: number
  /** Nome do mês seguinte, por extenso minúsculo ('dezembro'). */
  nomeProximoMes: string
}

export interface EstadoDono {
  /** 'dono:<uuid>'. */
  destino: string
  /** O dono já lançou o dia de hoje? É o que desliga o lembrete. */
  lancouHoje: boolean
  /** Dias seguidos sem lançamento, hoje incluído. Só muda o texto. */
  diasSeguidosSemLancar: number
  /** A barbearia abre hoje (calendário de operação). */
  abreHoje: boolean
  /** A meta do mês SEGUINTE já está cadastrada? Desliga a cobrança. */
  metaProximoMesPronta: boolean
}

export interface EstadoBarbeiro {
  /** 'barbeiro:<uuid>'. */
  destino: string
  /** O token do link dele — é pra lá que a notificação leva. */
  link: string
  /** A barbearia abre hoje. */
  abreHoje: boolean
  /** Há campanha de pontos ativa no ciclo? Sem ela, nada de pontos. */
  temCampanha: boolean
  /** É ele quem lança os pontos (campanha.quem_lanca = 'barbeiro'). */
  eleLanca: boolean
  /** Já lançou hoje, ou marcou que não pontuou. Desliga o lembrete. */
  lancouHoje: boolean
  /** Pontos que faltam pra meta dele. null = não há meta de pontos. */
  faltamPontos: number | null
  /** Já bateu a pontuação do mês. */
  bateuPontos: boolean
  /** Prêmio da faixa que ele persegue, pra citar pelo nome. */
  premio: string | null
  /** Dias que ainda restam no ciclo, hoje incluído. */
  diasRestantesCiclo: number
  /** Comissão acumulada no ciclo. */
  comissao: number
  /** Quanto falta pra meta de comissão. null = sem meta. */
  faltaMetaComissao: number | null
  /** Serviço extra que mais vale ponto, pra citar pelo nome. */
  servicoExtra: { nome: string; pontos: number } | null
  /** Diferença contra o mesmo ponto do ciclo anterior. null = sem anterior. */
  diferencaComparativo: number | null
  /** Rótulo curto do ciclo anterior ('out'). */
  labelAnterior: string
}

// ── DONO ────────────────────────────────────────────────────────────────────

export function avisosDoDono(e: EstadoDono, agora: Agora): Aviso[] {
  const out: Aviso[] = []

  // 1) LANÇAMENTO DIÁRIO — 18h às 23h, de hora em hora, até lançar.
  //
    // Dia fechado não gera cobrança: não há o que lançar, e cobrar folga é o
  // caminho mais curto pra pessoa desligar as notificações.
  if (e.abreHoje && !e.lancouHoje
      && agora.hora >= HORA_INICIO_LEMBRETE && agora.hora <= HORA_FIM_LEMBRETE) {
    out.push({
      destino: e.destino,
      tipo: 'lancamento-diario',
      // A hora entra no marco: é o que permite repetir de hora em hora sem
      // repetir DENTRO da mesma hora, se o cron rodar duas vezes.
      marco: `lancamento-diario:${agora.dia}:${agora.hora}`,
      mensagem: msg.donoLancamentoDiario(agora.hora, e.diasSeguidosSemLancar),
    })
  }

  // 2) META DO MÊS SEGUINTE — do dia 25 ao fim do mês, uma vez por dia.
  //
  // Uma por dia, e não de hora em hora: não é tarefa de dois minutos como o
  // lançamento, é uma sentada pra decidir número de cada barbeiro. Cobrar de
  // hora em hora uma coisa que leva meia hora só irrita.
  if (!e.metaProximoMesPronta
      && agora.diaDoMes >= DIA_COBRANCA_METAS
      && agora.hora === HORA_RESUMO) {
    out.push({
      destino: e.destino,
      tipo: 'metas-proximo-mes',
      marco: `metas-proximo-mes:${agora.dia}`,
      mensagem: msg.donoMetasProximoMes(agora.nomeProximoMes, agora.diasAteFimDoMes),
    })
  }

  return out
}

// ── COLABORADOR ─────────────────────────────────────────────────────────────

export function avisosDoBarbeiro(e: EstadoBarbeiro, agora: Agora): Aviso[] {
  const out: Aviso[] = []

  // 1) LANÇAR PONTOS — 18h às 23h, só em mês COM campanha e só se for ele
  // quem lança. No modo "dono lança", o barbeiro nem vê o formulário: cobrar
  // dele seria cobrar uma tarefa que o sistema não deixa ele fazer.
  if (e.temCampanha && e.eleLanca && e.abreHoje && !e.lancouHoje
      && agora.hora >= HORA_INICIO_LEMBRETE && agora.hora <= HORA_FIM_LEMBRETE) {
    out.push({
      destino: e.destino,
      tipo: 'lancar-pontos',
      marco: `lancar-pontos:${agora.dia}:${agora.hora}`,
      mensagem: msg.barbeiroLancarPontos(agora.hora, e.link, e.faltamPontos),
    })
  }

  // 2) OFERECER SERVIÇO EXTRA — de manhã, uma vez por dia de trabalho.
  //
  // Sai às 10h porque é lembrete pra USAR durante o dia. Mandado à noite,
  // junto dos outros, viraria cobrança do que já passou.
  if (e.temCampanha && e.abreHoje && agora.hora === HORA_SERVICO_EXTRA) {
    out.push({
      destino: e.destino,
      tipo: 'servico-extra',
      marco: `servico-extra:${agora.dia}`,
      mensagem: msg.barbeiroServicoExtra(
        e.link,
        e.servicoExtra?.nome ?? null,
        e.servicoExtra?.pontos ?? null,
      ),
    })
  }

  // 3) QUANTOS PONTOS FALTAM — uma vez por dia, no fim da tarde.
  //
  // E PARA quando ele bate: aí sai um aviso só, o de que bateu, e nunca mais.
  // Continuar mandando "faltam 0 pontos" seria ruído puro.
  if (e.temCampanha && agora.hora === HORA_RESUMO) {
    if (e.bateuPontos) {
      out.push({
        destino: e.destino,
        tipo: 'pontos-faltando',
        // Marco SEM o dia: é uma vez por ciclo, não uma por dia.
        marco: `pontos-bateu:${agora.dia.slice(0, 7)}`,
        mensagem: msg.barbeiroBateuPontos(e.link, e.premio),
      })
    } else if (e.faltamPontos != null && e.faltamPontos > 0) {
      out.push({
        destino: e.destino,
        tipo: 'pontos-faltando',
        marco: `pontos-faltando:${agora.dia}`,
        mensagem: msg.barbeiroPontosFaltando(
          e.link, e.faltamPontos, e.diasRestantesCiclo, e.premio,
        ),
      })
    }
  }

  // 4) COMISSÃO ATUAL — uma vez por dia, junto do resumo.
  //
  // Só pra quem tem comissão lançada: mandar "sua comissão: R$ 0" pra quem
  // ainda não teve nada no ciclo não informa, desanima.
  if (e.comissao > 0 && agora.hora === HORA_RESUMO) {
    out.push({
      destino: e.destino,
      tipo: 'comissao-atual',
      marco: `comissao:${agora.dia}`,
      mensagem: msg.barbeiroComissaoAtual(e.link, e.comissao, e.faltaMetaComissao),
    })
  }

  // 5) COMPARATIVO COM O MÊS PASSADO — semanal, segunda de manhã.
  //
  // Semanal porque a comparação quase não muda de um dia pro outro: diária,
  // seria a mesma frase sete vezes. Segunda porque é quando dá pra reagir — a
  // semana inteira pela frente.
  if (e.diferencaComparativo != null
      && agora.diaDaSemana === 1 && agora.hora === HORA_SERVICO_EXTRA) {
    out.push({
      destino: e.destino,
      tipo: 'comparativo',
      marco: `comparativo:${agora.dia}`,
      mensagem: msg.barbeiroComparativo(e.link, e.diferencaComparativo, e.labelAnterior),
    })
  }

  return out
}

/**
 * Teto de avisos por destinatário em cada execução.
 *
 * Às 17h o barbeiro pode cair em três regras ao mesmo tempo (pontos que
 * faltam, comissão, e nada mais). Três notificações no mesmo segundo são
 * lidas como uma só — e como spam. O teto mantém as mais acionáveis, na ordem
 * em que as regras foram escritas, e deixa o resto pra amanhã.
 */
export const MAX_POR_DESTINO = 2

export function limitarPorDestino(avisos: Aviso[], teto = MAX_POR_DESTINO): Aviso[] {
  const porDestino = new Map<string, number>()
  const out: Aviso[] = []
  for (const a of avisos) {
    const n = porDestino.get(a.destino) ?? 0
    if (n >= teto) continue
    porDestino.set(a.destino, n + 1)
    out.push(a)
  }
  return out
}
