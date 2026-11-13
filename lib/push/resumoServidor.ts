/**
 * OS NÚMEROS DO RESUMO — pontos que faltam, comissão, comparativo.
 *
 * Separado de `estadoServidor` porque o custo é outro. "O dono lançou hoje?"
 * são três consultas pra todas as barbearias de uma vez; "quantos pontos
 * faltam pro prêmio do Carlos?" é a apuração inteira da gamificação, por
 * barbearia. Rodar isso de hora em hora, pra todo mundo, seria pagar caro por
 * uma resposta que quase não muda.
 *
 * Então este arquivo só roda nas DUAS janelas que precisam dele: o resumo do
 * fim da tarde e o comparativo de segunda de manhã.
 *
 * ── POR QUE AS FUNÇÕES REAIS, E NÃO UM SELECT MAIS BARATO ───────────────────
 * Seria fácil somar `controle_diario` e dizer "faltam 12 pontos". Seria fácil
 * e estaria errado: a apuração de verdade tem regra personalizada, bônus de
 * assinatura e dia sem pontuação, e uma notificação dizendo 12 enquanto a tela
 * diz 9 destrói a confiança nos dois números. Então aqui se chama exatamente o
 * que o dashboard chama — `carregarGamificacao` e `montarComparativoPeriodo`.
 */

import { hojeBrasil, type Ciclo } from '@/lib/ciclo'
import { carregarBaseDoCiclo, carregarGamificacao } from '@/lib/premios/servidor'
import { montarComparativoPeriodo } from '@/lib/comparativoPeriodo'
import type { MetaIndividual } from '@/types/database'
import type { EstadoBarbeiro, Agora } from './regras'
import { HORA_RESUMO, HORA_SERVICO_EXTRA } from './regras'
import type { BarbeariaParaAvisar } from './estadoServidor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

/** Esta hora precisa dos números caros? */
export function precisaDoResumo(agora: Agora): boolean {
  if (agora.hora === HORA_RESUMO) return true
  // Comparativo: segunda de manhã.
  if (agora.diaDaSemana === 1 && agora.hora === HORA_SERVICO_EXTRA) return true
  // Serviço extra cita o nome do serviço, que também vem da campanha.
  if (agora.hora === HORA_SERVICO_EXTRA) return true
  return false
}

/**
 * Preenche, em cada barbeiro, os números que as regras precisam pra escolher
 * e escrever o aviso. Muta a lista recebida — é o estado daquela execução, e
 * copiar tudo de novo só pra manter pureza aqui não compra nada.
 */
export async function enriquecerComResumo(
  admin: Admin,
  barbearias: BarbeariaParaAvisar[],
  agora: Agora,
): Promise<void> {
  if (!precisaDoResumo(agora)) return
  const hoje = hojeBrasil()

  for (const b of barbearias) {
    if (b.barbeiros.length === 0) continue
    try {
      await enriquecerUma(admin, b, agora, hoje)
    } catch (e) {
      // Uma barbearia que falha não pode derrubar o aviso das outras. Sem os
      // números, as regras simplesmente não geram os avisos que dependem
      // deles — e o lembrete de lançar, que é o que mais importa, sai igual.
      console.error('[push] resumo falhou para a barbearia', b.id, e)
    }
  }
}

async function enriquecerUma(
  admin: Admin,
  b: BarbeariaParaAvisar,
  agora: Agora,
  hoje: Date,
): Promise<void> {
  const ciclo: Ciclo = b.ciclo

  // Meta do ciclo: dá o campo-base, a meta coletiva e as individuais.
  const { data: metaRaw } = await admin
    .from('metas')
    .select('id, meta_coletiva, faturamento_acumulado')
    .eq('barbearia_id', b.id).eq('mes', ciclo.mesRef).eq('ano', ciclo.anoRef)
    .maybeSingle()
  const meta = metaRaw as { id: string; meta_coletiva: number; faturamento_acumulado: number } | null

  const { data: metasIndRaw } = meta
    ? await admin.from('metas_individuais').select('*').eq('meta_id', meta.id)
    : { data: [] }
  const metasIndividuais = (metasIndRaw ?? []) as MetaIndividual[]

  const base = await carregarBaseDoCiclo(admin, b.id, ciclo.mesRef, ciclo.anoRef, metasIndividuais)
  const gam = await carregarGamificacao(admin, {
    barbeariaId: b.id,
    mes: ciclo.mesRef, ano: ciclo.anoRef, ciclo,
    ehPeriodoAtual: true, hoje,
    barbeiros: base.barbeiros, ranking: base.ranking,
    // `false`: copiar a campanha do ciclo anterior é ato do dashboard, com o
    // dono presente. Um cron não cria campanha para ninguém.
    garantirCampanha: false,
  })

  const camp = gam.campanha
  const minBarbeiro = Number(camp?.min_pontos) || 0
  const minRecep = Number((camp as { min_pontos_recep?: number } | null)?.min_pontos_recep) || 0

  // O serviço que mais vale ponto — é o que vale a pena oferecer.
  const servicos = (camp?.campanha_servicos ?? [])
    .map((s) => ({ nome: s.nome ?? '', pontos: Number(s.pontos) || 0 }))
    .filter((s) => s.nome && s.pontos > 0)
    .sort((x, y) => y.pontos - x.pontos)
  const servicoExtra = servicos[0] ?? null

  // Prêmio da campanha de pontos é por POSIÇÃO e em dinheiro (1º, 2º, 3º),
  // não um prêmio nomeado por faixa de pontuação. Então as frases de pontos
  // saem sem citar prêmio — melhor do que inventar um nome que não existe no
  // cadastro e que a pessoa não reconheceria.
  const premioNomeado: string | null = null

  // ── Comparativo com o mesmo ponto do ciclo anterior ──
  // Só na janela semanal: é a única que usa, e são duas consultas a mais.
  let comparativo: Awaited<ReturnType<typeof montarComparativoPeriodo>> | null = null
  if (agora.diaDaSemana === 1 && agora.hora === HORA_SERVICO_EXTRA) {
    const anteriorPorBarbeiro: Record<string, number> = {}
    const atualPorBarbeiro: Record<string, number> = {}
    for (const r of base.ranking) atualPorBarbeiro[r.id] = r.comissao

    const antes = new Date(ciclo.inicio); antes.setDate(antes.getDate() - 1)
    const { data: lancAntRaw } = await admin
      .from('lancamentos').select('barbeiro_id, comissao_acumulada')
      .eq('barbearia_id', b.id)
      .eq('mes', antes.getMonth() + 1).eq('ano', antes.getFullYear())
    for (const l of (lancAntRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
      anteriorPorBarbeiro[l.barbeiro_id] = Number(l.comissao_acumulada) || 0
    }

    const totalAtual = base.ranking.reduce((s, r) => s + r.comissao, 0)
    const totalAnterior = Object.values(anteriorPorBarbeiro).reduce((s, v) => s + v, 0)

    comparativo = await montarComparativoPeriodo(admin, {
      barbeariaId: b.id,
      ciclo,
      diaFechamento: ciclo.inicio.getDate(),
      hoje,
      ehPeriodoAtual: true,
      barbeiroIds: base.ranking.map((r) => r.id),
      totalAtual,
      totalAnteriorCheio: totalAnterior,
      atualPorBarbeiro,
      anteriorCheioPorBarbeiro: anteriorPorBarbeiro,
    })
  }

  for (const eb of b.barbeiros) {
    const id = eb.destino.slice('barbeiro:'.length)
    const noRanking = base.ranking.find((r) => r.id === id)
    if (!noRanking) continue

    const ehRecep = noRanking.tipo === 'recepcionista'
    const minimo = ehRecep ? minRecep : minBarbeiro
    const pontos = Number(gam.pontosMap[id]) || 0

    if (camp && minimo > 0) {
      eb.faltamPontos = Math.max(0, minimo - pontos)
      eb.bateuPontos = pontos >= minimo
      eb.premio = premioNomeado
    }

    eb.comissao = noRanking.comissao
    // "Falta pra meta" é a PRÓXIMA faixa que ele ainda não alcançou — não a
    // maior. Dizer "faltam R$ 8.000 pro ouro" pra quem está perto do bronze
    // desanima em vez de puxar.
    const faixas = [
      Number(noRanking.metaInd?.bronze_comm) || 0,
      Number(noRanking.metaInd?.prata_comm) || 0,
      Number(noRanking.metaInd?.ouro_comm) || 0,
    ].filter((v) => v > 0).sort((a, c) => a - c)
    const proxima = faixas.find((v) => v > noRanking.comissao)
    eb.faltaMetaComissao = proxima != null
      ? Math.max(0, proxima - noRanking.comissao)
      : faixas.length > 0 ? 0 : null
    eb.servicoExtra = servicoExtra

    const escopo = comparativo?.porBarbeiro?.[id]
    if (escopo && escopo.totalAnterior > 0) {
      eb.diferencaComparativo = escopo.atual - escopo.anterior
      eb.labelAnterior = comparativo!.labelAnterior
    }
  }
}
