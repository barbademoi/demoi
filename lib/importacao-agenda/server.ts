import 'server-only'

import { createHash } from 'node:crypto'
import { cicloDeData } from '@/lib/ciclo'
import { buscarConfiguracaoValores } from '@/lib/lancamentos/valores'
import type {
  LeituraRelatorioAgenda,
  MapeamentoConfirmadoAgenda,
  PreviewConfirmacaoAgenda,
} from './types'

type SupabaseLike = {
  from: (tabela: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

type FotoAgenda = {
  barbeiro_id: string
  data_relatorio: string
  faturamento_acumulado: number | string
  comissao_acumulada: number | string
}

export function normalizarNomeAgenda(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function hashArquivoAgenda(file: File): Promise<string> {
  return createHash('sha256')
    .update(new Uint8Array(await file.arrayBuffer()))
    .digest('hex')
}

function dataDoRelatorio(dataIso: string): Date {
  const match = dataIso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) throw new Error('A data final do relatório é inválida.')
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
}

export async function montarPreviewConfirmacaoAgenda(
  supabase: SupabaseLike,
  barbeariaId: string,
  diaFechamento: number,
  leitura: LeituraRelatorioAgenda,
  mapeamentos: MapeamentoConfirmadoAgenda[],
  arquivoHash: string,
): Promise<PreviewConfirmacaoAgenda> {
  if (
    !/^[a-f0-9]{64}$/.test(arquivoHash) ||
    !Array.isArray(mapeamentos) ||
    mapeamentos.length !== leitura.profissionais.length
  ) {
    throw new Error('O de-para dos barbeiros está incompleto.')
  }

  const porNome = new Map(
    mapeamentos.map(item => [normalizarNomeAgenda(item.nomeRelatorio), item]),
  )
  const ids = mapeamentos.map(item => item.barbeiroId)
  if (
    porNome.size !== leitura.profissionais.length ||
    new Set(ids).size !== ids.length ||
    ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))
  ) {
    throw new Error('Cada nome do relatório precisa apontar para um barbeiro diferente.')
  }

  const { data: barbeirosRaw, error: barbeirosError } = await supabase
    .from('barbeiros')
    .select('id, nome, tipo')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .in('id', ids)
  if (barbeirosError) throw new Error('Não foi possível validar os barbeiros.')
  const nomesPorId = new Map(
    ((barbeirosRaw ?? []) as Array<{ id: string; nome: string; tipo: string | null }>)
      .filter(item => item.tipo !== 'recepcionista')
      .map(item => [item.id, item.nome]),
  )
  if (nomesPorId.size !== ids.length) {
    throw new Error('Há barbeiro inativo ou que não pertence a esta barbearia.')
  }

  const inicioMes = leitura.periodoInicio
  const fimMes = `${leitura.periodoFim.slice(0, 7)}-31`
  const { data: fotosRaw, error: fotosError } = await supabase
    .from('importacao_agenda_fotos')
    .select('barbeiro_id, data_relatorio, faturamento_acumulado, comissao_acumulada')
    .eq('barbearia_id', barbeariaId)
    .in('barbeiro_id', ids)
    .gte('data_relatorio', inicioMes)
    .lte('data_relatorio', fimMes)
    .order('data_relatorio', { ascending: true })
  if (fotosError) {
    throw new Error('A importação diária ainda não está preparada no banco de dados.')
  }
  const fotos = (fotosRaw ?? []) as FotoAgenda[]

  const config = await buscarConfiguracaoValores(supabase, barbeariaId)
  const ciclo = cicloDeData(dataDoRelatorio(leitura.periodoFim), diaFechamento)
  const { data: fechamentoRaw } = await supabase
    .from('meses_fechados')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('mes', ciclo.mesRef)
    .eq('ano', ciclo.anoRef)
    .maybeSingle()
  const cicloFechado = Boolean(fechamentoRaw)

  const linhas = leitura.profissionais.map(profissional => {
    const mapeamento = porNome.get(normalizarNomeAgenda(profissional.nomeRelatorio))
    if (!mapeamento) throw new Error(`Confirme o barbeiro correspondente a “${profissional.nomeRelatorio}”.`)

    const fotosDoBarbeiro = fotos.filter(foto => foto.barbeiro_id === mapeamento.barbeiroId)
    const anterior = [...fotosDoBarbeiro]
      .reverse()
      .find(foto => foto.data_relatorio < leitura.periodoFim)
    const mesmaData = fotosDoBarbeiro.find(foto => foto.data_relatorio === leitura.periodoFim)
    const proxima = fotosDoBarbeiro.find(foto => foto.data_relatorio > leitura.periodoFim)
    const faturamentoAnterior = Number(anterior?.faturamento_acumulado) || 0
    const comissaoAnterior = Number(anterior?.comissao_acumulada) || 0

    return {
      ...profissional,
      barbeiroId: mapeamento.barbeiroId,
      barbeiroNome: nomesPorId.get(mapeamento.barbeiroId) ?? '',
      faturamentoAnterior,
      comissaoAnterior,
      movimentoFaturamento: Math.round(
        (profissional.faturamentoAcumulado - faturamentoAnterior) * 100,
      ) / 100,
      movimentoComissao: Math.round(
        (profissional.comissaoAcumulada - comissaoAnterior) * 100,
      ) / 100,
      reimportacao: Boolean(mesmaData),
      proximaDataRecalculada: proxima?.data_relatorio ?? null,
    }
  })

  const avisos: string[] = []
  const reimportacao = linhas.some(linha => linha.reimportacao)
  const proximasRecalculadas = new Set(
    linhas.map(linha => linha.proximaDataRecalculada).filter(Boolean),
  )
  if (reimportacao) {
    avisos.push('Já existe uma foto nesta data. Ao confirmar, ela será atualizada — não será somada nem duplicada.')
  }
  if (proximasRecalculadas.size > 0) {
    avisos.push('Há uma importação posterior no mês. O movimento desse próximo dia também será recalculado para manter a diferença correta.')
  }
  if (linhas.some(linha => linha.movimentoFaturamento < 0 || linha.movimentoComissao < 0)) {
    avisos.push('Há movimento negativo em pelo menos uma trilha. Confira se o relatório acumulado diminuiu por ajuste no Agenda Serviço.')
  }
  if (cicloFechado) {
    avisos.push(`O ciclo ${ciclo.label} está fechado. Reabra-o antes de confirmar.`)
  }

  return {
    leitura,
    linhas,
    modoMeta: config.modoMeta,
    baseMeta: config.baseMeta,
    reimportacao,
    cicloFechado,
    totaisMovimento: {
      faturamento: Math.round(
        linhas.reduce((total, linha) => total + linha.movimentoFaturamento, 0) * 100,
      ) / 100,
      comissao: Math.round(
        linhas.reduce((total, linha) => total + linha.movimentoComissao, 0) * 100,
      ) / 100,
    },
    avisos,
    arquivoHash,
  }
}
