// CORTE DE CICLO DA BRINDOLETA.
//
// O painel do dono somava giros e vendas desde a primeira venda registrada,
// sem corte de período nenhum: ao virar o mês o valor não zerava, continuava
// crescendo. A tela do BARBEIRO, essa sim, já corta pelo ciclo da barbearia
// (migrations 052/053) — então os dois lados mostravam períodos diferentes
// para o mesmo dado, e a migration 052 avisa no comentário que isso faria o
// barbeiro deixar de confiar nos dois números.
//
// Aqui mora a régua do lado do dono, feita para casar exatamente com a de lá:
// mesmo dia_fechamento, mesmo fuso, mesma coluna de data (`created_at`).

import { cicloDeData, type Ciclo } from '@/lib/ciclo'

/**
 * O Brasil não observa horário de verão desde 2019, então o deslocamento é
 * fixo. Escrever o offset no texto da data é o que transforma "26/08 no
 * calendário brasileiro" no instante UTC exato que o banco compara — sem isso,
 * as três primeiras horas de cada dia cairiam no ciclo errado.
 */
const OFFSET_BR = '-03:00'

export interface JanelaCiclo {
  /** Primeiro instante do ciclo, em ISO UTC. */
  inicioIso: string
  /** Instante logo APÓS o último do ciclo, em ISO UTC (comparação exclusiva). */
  fimExclusivoIso: string
  ciclo: Ciclo
}

/**
 * A janela de um ciclo como par de instantes, pronta para `gte`/`lt`.
 *
 * O fim é EXCLUSIVO de propósito. Um `lte` no último dia às 23:59:59 perderia
 * uma venda registrada em 23:59:59,4 — e uma venda some com muito mais
 * facilidade do que alguém percebe.
 */
export function janelaDoCiclo(mes: number, ano: number, diaFechamento: number): JanelaCiclo {
  // (mes, ano) identificam o INÍCIO do ciclo, mesma convenção de
  // lancamentos/metas. Uma data ao meio-dia dentro dele devolve o ciclo certo
  // sem risco de arredondar para o vizinho.
  const ciclo = cicloDeData(new Date(ano, mes - 1, diaFechamento, 12, 0, 0), diaFechamento)

  const inicio = new Date(`${ciclo.inicioIso}T00:00:00.000${OFFSET_BR}`)
  // Dia seguinte ao fim, à meia-noite: o primeiro instante que já NÃO é deste
  // ciclo.
  const fimMais1 = new Date(`${ciclo.fimIso}T00:00:00.000${OFFSET_BR}`)
  fimMais1.setUTCDate(fimMais1.getUTCDate() + 1)

  return {
    inicioIso: inicio.toISOString(),
    fimExclusivoIso: fimMais1.toISOString(),
    ciclo,
  }
}

/** Um registro com data, o mínimo que o corte precisa enxergar. */
export interface ComData {
  created_at: string
}

/** Está dentro da janela? Fim exclusivo, mesma regra da consulta. */
export function dentroDaJanela(registro: ComData, janela: JanelaCiclo): boolean {
  const t = new Date(registro.created_at).getTime()
  if (!Number.isFinite(t)) return false
  return t >= new Date(janela.inicioIso).getTime() && t < new Date(janela.fimExclusivoIso).getTime()
}

export interface VendaBrindoleta extends ComData {
  barbeiro_id: string
  status: string
  amount_cents: number
}

export interface GiroBrindoleta extends ComData {
  barbeiro_id: string
}

export interface TotaisCiclo {
  giros: number
  aceitas: number
  confirmadas: number
  /** Só de vendas CONFIRMADAS — pendente não é dinheiro ainda. */
  receitaCents: number
}

/**
 * Os números do ciclo.
 *
 * `pendentes` NÃO sai daqui de propósito: venda pendente é fila de trabalho,
 * não placar. Uma venda de agosto que ninguém confirmou continua precisando de
 * decisão, e escondê-la na virada do mês faria dinheiro real desaparecer da
 * tela sem que ninguém tivesse decidido nada. Ela é contada à parte, sobre
 * todo o período, e a tela diz isso.
 */
export function totaisDoCiclo(giros: GiroBrindoleta[], vendas: VendaBrindoleta[]): TotaisCiclo {
  const confirmadas = (vendas ?? []).filter((v) => v.status === 'confirmed')
  return {
    giros: (giros ?? []).length,
    aceitas: (vendas ?? []).length,
    confirmadas: confirmadas.length,
    receitaCents: confirmadas.reduce((s, v) => s + (Number(v.amount_cents) || 0), 0),
  }
}

/**
 * A lista de vendas que o dono confere na tela.
 *
 * É a união do ciclo exibido COM as pendentes de qualquer outro ciclo. As duas
 * partes têm papéis diferentes: o ciclo é o que aconteceu no mês, as pendentes
 * são o que ainda espera decisão. Se a lista mostrasse só o ciclo, uma venda de
 * agosto não confirmada ficaria sem nenhum lugar na interface a partir de
 * setembro — o dono não teria como confirmá-la nem saberia que ela existe.
 *
 * Vem ordenada da mais recente para a mais antiga, como já vinha.
 */
export function listaParaConferencia<T extends ComData & { id: string }>(
  doCiclo: T[],
  pendentesDeTodoPeriodo: T[],
): T[] {
  const vistos = new Set((doCiclo ?? []).map((v) => v.id))
  const forasteiras = (pendentesDeTodoPeriodo ?? []).filter((v) => !vistos.has(v.id))
  return [...(doCiclo ?? []), ...forasteiras]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export interface DesempenhoBarbeiro extends TotaisCiclo {
  barbeiroId: string
  /** Aceites por giro, em %. Sem giro não existe taxa. */
  conversao: number
}

/** Desempenho por colaborador no ciclo, do maior faturamento para o menor. */
export function desempenhoPorBarbeiro(
  barbeiroIds: string[],
  giros: GiroBrindoleta[],
  vendas: VendaBrindoleta[],
): DesempenhoBarbeiro[] {
  return (barbeiroIds ?? []).map((id) => {
    const meus = totaisDoCiclo(
      (giros ?? []).filter((g) => g.barbeiro_id === id),
      (vendas ?? []).filter((v) => v.barbeiro_id === id),
    )
    return {
      barbeiroId: id,
      ...meus,
      conversao: meus.giros > 0 ? Math.round((meus.aceitas / meus.giros) * 100) : 0,
    }
  }).sort((a, b) => b.receitaCents - a.receitaCents || b.confirmadas - a.confirmadas)
}
