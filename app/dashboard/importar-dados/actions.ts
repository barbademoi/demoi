'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cicloAtual, cicloDeData, hojeBrasil } from '@/lib/ciclo'
import { estaFechado } from '@/lib/mesFechado'
import { emailTemImportacao } from '@/lib/importacao/access'
import {
  buscarConfiguracaoValores,
  montarPatchValores,
  valorAtualDoTipo,
  type ValoresAtuais,
} from '@/lib/lancamentos/valores'
import type {
  AcaoConflito,
  LinhaPreview,
  PedidoConfirmacaoImportacao,
  PedidoPreviewImportacao,
  PreviewImportacao,
  ResultadoConfirmacao,
  TipoValorImportado,
} from '@/lib/importacao/types'

type Supabase = ReturnType<typeof createClient>

type Acesso = {
  supabase: Supabase
  usuarioId: string
  barbeariaId: string
  diaFechamento: number
  modoMeta: 'faturamento' | 'comissao' | 'ambos'
  baseMeta: 'faturamento' | 'comissao'
}

type DiarioExistente = ValoresAtuais & {
  barbeiro_id: string
  data: string
  valor: number | string | null
}

type PreviewInterno =
  | { error: string }
  | {
      preview: PreviewImportacao
      acesso: Acesso
      existentes: Map<string, DiarioExistente>
      nomesPorId: Map<string, string>
    }

const MAX_LINHAS_AGREGADAS = 2_000

function validarTipoNoModo(
  tipo: TipoValorImportado,
  modo: Acesso['modoMeta'],
): boolean {
  return modo === 'ambos' || modo === tipo
}

function dataIsoValida(data: string): boolean {
  const m = data.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false
  const ano = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia
}

function valorDiarioDoTipo(
  row: DiarioExistente | undefined,
  tipo: TipoValorImportado,
  baseMeta: Acesso['baseMeta'],
): number {
  if (!row) return 0
  const especifico = tipo === 'faturamento'
    ? row.valor_faturamento
    : row.valor_comissao
  if (especifico != null) return Number(especifico) || 0
  return tipo === baseMeta ? (Number(row.valor) || 0) : 0
}

async function donoComAcesso(): Promise<Acesso | { error: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  if (!emailTemImportacao(user.email ?? null)) {
    return { error: 'Sem acesso à importação em teste.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(dia_fechamento, modo_meta, base_meta)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as {
    barbearia_id: string
    barbearias: {
      dia_fechamento: number | null
      modo_meta: Acesso['modoMeta'] | null
      base_meta: Acesso['baseMeta'] | null
    } | null
  } | null
  if (!usuario?.barbearias) return { error: 'Barbearia não encontrada.' }
  const cfg = await buscarConfiguracaoValores(supabase as any, usuario.barbearia_id)
  return {
    supabase,
    usuarioId: user.id,
    barbeariaId: usuario.barbearia_id,
    diaFechamento: usuario.barbearias.dia_fechamento ?? 1,
    modoMeta: cfg.modoMeta,
    baseMeta: cfg.baseMeta,
  }
}

async function montarPreviewInterno(
  pedido: PedidoPreviewImportacao,
): Promise<PreviewInterno> {
  const acesso = await donoComAcesso()
  if ('error' in acesso) return acesso

  if (!pedido || !Array.isArray(pedido.linhas)) return { error: 'Dados da importação inválidos.' }
  if (!pedido.arquivoNome?.trim() || !/^[a-f0-9]{64}$/i.test(pedido.arquivoHash ?? '')) {
    return { error: 'Arquivo inválido. Selecione o arquivo novamente.' }
  }
  if (!['faturamento', 'comissao'].includes(pedido.tipoValor)) {
    return { error: 'Escolha se o valor é faturamento ou comissão.' }
  }
  if (!validarTipoNoModo(pedido.tipoValor, acesso.modoMeta)) {
    const aceito = acesso.modoMeta === 'faturamento' ? 'faturamento' : 'comissão'
    return { error: `Esta barbearia está configurada para ${aceito}.` }
  }
  if (pedido.linhas.length === 0) return { error: 'Nenhum lançamento válido para pré-visualizar.' }
  if (pedido.linhas.length > MAX_LINHAS_AGREGADAS) return { error: 'A importação excede o limite de lançamentos.' }

  // Confirma no servidor que cada barbeiro pertence à barbearia e está ativo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (acesso.supabase as any)
    .from('barbeiros')
    .select('id, nome')
    .eq('barbearia_id', acesso.barbeariaId)
    .eq('ativo', true)
  const nomesPorId = new Map(
    ((barbeirosRaw ?? []) as { id: string; nome: string }[]).map(b => [b.id, b.nome]),
  )

  const ciclo = cicloAtual(acesso.diaFechamento, hojeBrasil())
  const trava = await estaFechado(
    acesso.supabase,
    acesso.barbeariaId,
    ciclo.mesRef,
    ciclo.anoRef,
  )

  const validas = pedido.linhas.filter(l =>
    typeof l.barbeiroId === 'string' &&
    nomesPorId.has(l.barbeiroId) &&
    dataIsoValida(l.data) &&
    Number.isFinite(l.valor) &&
    l.valor >= 0 &&
    Number.isInteger(l.linhasOriginais) &&
    l.linhasOriginais > 0,
  )
  if (validas.length !== pedido.linhas.length) {
    return { error: 'Há barbeiros não confirmados ou linhas inválidas. Revise o mapeamento.' }
  }

  const dentroPeriodoAntesDeAgrupar = validas.filter(
    l => l.data >= ciclo.inicioIso && l.data <= ciclo.fimIso,
  )
  const foraDoPeriodo = validas.length - dentroPeriodoAntesDeAgrupar.length

  // Dois nomes diferentes do arquivo podem ser confirmados como o mesmo
  // barbeiro. Agrega novamente DEPOIS do casamento para garantir uma única
  // linha por barbeiro + dia também no servidor.
  const agrupadasServidor = new Map<string, typeof validas[number]>()
  for (const linha of dentroPeriodoAntesDeAgrupar) {
    const chave = `${linha.barbeiroId}|${linha.data}`
    const atual = agrupadasServidor.get(chave)
    if (atual) {
      atual.valor = Math.round((atual.valor + linha.valor) * 100) / 100
      atual.linhasOriginais += linha.linhasOriginais
      if (!atual.nomeArquivo.includes(linha.nomeArquivo)) {
        atual.nomeArquivo = `${atual.nomeArquivo} / ${linha.nomeArquivo}`
      }
    } else {
      agrupadasServidor.set(chave, { ...linha })
    }
  }
  const dentroPeriodo = Array.from(agrupadasServidor.values())
  const barbeiroIds = Array.from(new Set(dentroPeriodo.map(l => l.barbeiroId)))

  let diariosRaw: DiarioExistente[] = []
  if (barbeiroIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (acesso.supabase as any)
      .from('lancamentos_diarios')
      .select('barbeiro_id, data, valor, valor_faturamento, valor_comissao')
      .eq('barbearia_id', acesso.barbeariaId)
      .in('barbeiro_id', barbeiroIds)
      .gte('data', ciclo.inicioIso)
      .lte('data', ciclo.fimIso)
    if (error) {
      return { error: 'A importação ainda não está preparada no banco de dados.' }
    }
    diariosRaw = (data ?? []) as DiarioExistente[]
  }
  const existentes = new Map(
    diariosRaw.map(row => [`${row.barbeiro_id}|${row.data}`, row]),
  )

  let acumuladoSemDetalhe = 0
  if (barbeiroIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mensaisRaw } = await (acesso.supabase as any)
      .from('lancamentos')
      .select('barbeiro_id, comissao_acumulada, valor_faturamento, valor_comissao')
      .eq('barbearia_id', acesso.barbeariaId)
      .eq('mes', ciclo.mesRef)
      .eq('ano', ciclo.anoRef)
      .in('barbeiro_id', barbeiroIds)
    const totalMensal = ((mensaisRaw ?? []) as Array<ValoresAtuais & { barbeiro_id: string }>)
      .reduce(
        (s, row) => s + valorAtualDoTipo(row, pedido.tipoValor, acesso.baseMeta),
        0,
      )
    const totalDiario = diariosRaw.reduce(
      (s, row) => s + valorDiarioDoTipo(row, pedido.tipoValor, acesso.baseMeta),
      0,
    )
    acumuladoSemDetalhe = Math.max(0, Math.round((totalMensal - totalDiario) * 100) / 100)
  }

  const linhas: LinhaPreview[] = dentroPeriodo.map(l => {
    const chave = `${l.barbeiroId}|${l.data}`
    const valorExistente = valorDiarioDoTipo(
      existentes.get(chave),
      pedido.tipoValor,
      acesso.baseMeta,
    )
    return {
      chave,
      barbeiroId: l.barbeiroId,
      barbeiroNome: nomesPorId.get(l.barbeiroId) ?? '',
      nomeArquivo: l.nomeArquivo,
      data: l.data,
      valorImportado: Math.round(l.valor * 100) / 100,
      valorExistente,
      conflito: valorExistente > 0,
      linhasOriginais: l.linhasOriginais,
      acao: valorExistente > 0 ? 'ignorar' : 'substituir',
    }
  })

  const conflitos = linhas.filter(l => l.conflito).length
  const avisos: string[] = []
  if (foraDoPeriodo > 0) {
    avisos.push(`${foraDoPeriodo} lançamento(s) ficaram fora do ciclo atual e serão ignorados.`)
  }
  if (trava.fechado) {
    avisos.push('O ciclo atual está fechado. Reabra o mês antes de confirmar a importação.')
  }
  if (conflitos > 0) {
    avisos.push(`${conflitos} lançamento(s) já possuem valor. O padrão seguro é ignorar.`)
  }
  if (acumuladoSemDetalhe > 0) {
    avisos.push(
      `Já existem R$ ${acumuladoSemDetalhe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acumulados sem detalhamento diário. Esse valor será preservado; a importação acrescenta somente as diferenças dos dias confirmados.`,
    )
  }

  const preview: PreviewImportacao = {
    linhas,
    resumo: {
      linhasArquivo: Math.max(0, Number(pedido.linhasArquivo) || 0),
      linhasValidas: Math.max(0, Number(pedido.linhasValidas) || 0),
      lancamentosAgregados: pedido.linhas.length,
      lancamentosImportaveis: trava.fechado ? 0 : linhas.length,
      conflitos,
      foraDoPeriodo,
      mesesFechados: trava.fechado ? linhas.length : 0,
      totalImportavel: linhas.reduce((s, l) => s + l.valorImportado, 0),
      periodoInicio: ciclo.inicioIso,
      periodoFim: ciclo.fimIso,
    },
    avisos,
    tipoValor: pedido.tipoValor,
    arquivoNome: pedido.arquivoNome.slice(0, 255),
    arquivoHash: pedido.arquivoHash.toLowerCase(),
  }

  return { preview, acesso, existentes, nomesPorId }
}

export async function previsualizarImportacao(
  pedido: PedidoPreviewImportacao,
): Promise<PreviewImportacao | { error: string }> {
  const result = await montarPreviewInterno(pedido)
  return 'error' in result ? result : result.preview
}

export async function confirmarImportacao(
  pedido: PedidoConfirmacaoImportacao,
): Promise<ResultadoConfirmacao | { error: string }> {
  // Recalcula a prévia com o estado MAIS RECENTE do banco. Assim, um
  // lançamento criado entre a prévia e o clique em confirmar vira conflito.
  const result = await montarPreviewInterno(pedido)
  if ('error' in result) return result
  const { preview, acesso, existentes } = result
  if (preview.resumo.mesesFechados > 0) return { error: 'O mês está fechado. Reabra antes de importar.' }

  const acoes = new Map<string, AcaoConflito>()
  for (const item of pedido.acoes ?? []) {
    if (['ignorar', 'substituir', 'somar'].includes(item.acao)) {
      acoes.set(item.chave, item.acao)
    }
  }

  type Aplicacao = {
    linha: LinhaPreview
    acao: AcaoConflito
    valorFinal: number
    delta: number
  }
  type DeltaCiclo = {
    barbeiroId: string
    mes: number
    ano: number
    delta: number
  }
  const aplicacoes: Aplicacao[] = []
  const ignoradas: Aplicacao[] = []

  for (const linha of preview.linhas) {
    // Conflito sem decisão explícita SEMPRE ignora.
    const acao = linha.conflito ? (acoes.get(linha.chave) ?? 'ignorar') : 'substituir'
    if (acao === 'ignorar') {
      ignoradas.push({ linha, acao, valorFinal: linha.valorExistente, delta: 0 })
      continue
    }
    const valorFinal = acao === 'somar'
      ? linha.valorExistente + linha.valorImportado
      : linha.valorImportado
    const arredondado = Math.round(valorFinal * 100) / 100
    aplicacoes.push({
      linha,
      acao,
      valorFinal: arredondado,
      delta: Math.round((arredondado - linha.valorExistente) * 100) / 100,
    })
  }

  if (aplicacoes.length === 0) {
    return { error: 'Nenhum lançamento foi selecionado para gravar.' }
  }

  const agora = new Date().toISOString()
  const rowsDia = aplicacoes.map(a => {
    const existente = existentes.get(a.linha.chave)
    const row: Record<string, unknown> = {
      barbearia_id: acesso.barbeariaId,
      barbeiro_id: a.linha.barbeiroId,
      data: a.linha.data,
      atualizado_em: agora,
    }
    if (pedido.tipoValor === 'faturamento') row.valor_faturamento = a.valorFinal
    else row.valor_comissao = a.valorFinal
    // O campo legado espelha somente a base configurada. Importar a outra
    // trilha no modo "ambos" não altera ranking/meta.
    if (pedido.tipoValor === acesso.baseMeta) row.valor = a.valorFinal
    else if (!existente) row.valor = 0
    return row
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: erroDia } = await (acesso.supabase as any)
    .from('lancamentos_diarios')
    .upsert(rowsDia, { onConflict: 'barbeiro_id,data' })
  if (erroDia) return { error: `Não foi possível gravar os lançamentos diários: ${erroDia.message}` }

  // Atualiza acumulados mensais por DELTA, preservando tudo que o dono já
  // lançou manualmente. A montagem das colunas usa a mesma função do
  // formulário de lançamento manual.
  const deltaPorBarbeiroCiclo = new Map<string, DeltaCiclo>()
  for (const a of aplicacoes) {
    const ciclo = cicloDeData(new Date(`${a.linha.data}T12:00:00`), acesso.diaFechamento)
    const chave = `${a.linha.barbeiroId}|${ciclo.mesRef}|${ciclo.anoRef}`
    const atual = deltaPorBarbeiroCiclo.get(chave)
    if (atual) atual.delta = Math.round((atual.delta + a.delta) * 100) / 100
    else deltaPorBarbeiroCiclo.set(chave, {
      barbeiroId: a.linha.barbeiroId,
      mes: ciclo.mesRef,
      ano: ciclo.anoRef,
      delta: a.delta,
    })
  }

  const gruposCiclo = new Map<string, DeltaCiclo[]>()
  for (const item of Array.from(deltaPorBarbeiroCiclo.values())) {
    const chave = `${item.mes}|${item.ano}`
    const grupo = gruposCiclo.get(chave) ?? []
    grupo.push(item)
    gruposCiclo.set(chave, grupo)
  }

  for (const grupo of Array.from(gruposCiclo.values())) {
    if (grupo.length === 0) continue
    const { mes, ano } = grupo[0]
    const ids = grupo.map(g => g.barbeiroId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: atuaisRaw, error: erroLeitura } = await (acesso.supabase as any)
      .from('lancamentos')
      .select('barbeiro_id, comissao_acumulada, valor_faturamento, valor_comissao, numero_atendimentos')
      .eq('barbearia_id', acesso.barbeariaId)
      .eq('mes', mes)
      .eq('ano', ano)
      .in('barbeiro_id', ids)
    if (erroLeitura) return { error: `Os valores diários foram gravados, mas o acumulado não pôde ser lido: ${erroLeitura.message}` }

    const atuais = new Map(
      ((atuaisRaw ?? []) as Array<ValoresAtuais & { barbeiro_id: string; numero_atendimentos: number | null }>)
        .map(row => [row.barbeiro_id, row]),
    )
    const rowsMes = grupo.map(g => {
      const atual = atuais.get(g.barbeiroId)
      const atualSelecionado = valorAtualDoTipo(atual, pedido.tipoValor, acesso.baseMeta)
      const novoSelecionado = Math.max(0, Math.round((atualSelecionado + g.delta) * 100) / 100)
      const fat = pedido.tipoValor === 'faturamento' ? novoSelecionado : null
      const com = pedido.tipoValor === 'comissao' ? novoSelecionado : null
      return {
        barbearia_id: acesso.barbeariaId,
        barbeiro_id: g.barbeiroId,
        mes,
        ano,
        numero_atendimentos: Number(atual?.numero_atendimentos) || 0,
        modo: 'direto',
        ...montarPatchValores(fat, com, acesso.baseMeta),
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroMes } = await (acesso.supabase as any)
      .from('lancamentos')
      .upsert(rowsMes, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })
    if (erroMes) return { error: `Os valores diários foram gravados, mas o acumulado não pôde ser atualizado: ${erroMes.message}` }

    if (pedido.tipoValor === 'faturamento') {
      const deltaCasa = grupo.reduce((s, g) => s + g.delta, 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: metaRaw } = await (acesso.supabase as any)
        .from('metas')
        .select('id, faturamento_acumulado')
        .eq('barbearia_id', acesso.barbeariaId)
        .eq('mes', mes)
        .eq('ano', ano)
        .maybeSingle()
      if (metaRaw) {
        const novoTotal = Math.max(
          0,
          Math.round(((Number(metaRaw.faturamento_acumulado) || 0) + deltaCasa) * 100) / 100,
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: erroMeta } = await (acesso.supabase as any)
          .from('metas')
          .update({ faturamento_acumulado: novoTotal })
          .eq('id', metaRaw.id)
        if (erroMeta) return { error: `Os valores individuais foram gravados, mas o total da casa não pôde ser atualizado: ${erroMeta.message}` }
      }
    }
  }

  const totalAplicado = Math.round(aplicacoes.reduce((s, a) => s + a.valorFinal, 0) * 100) / 100
  let loteId: string | null = null
  let mensagemAuditoria = 'Resumo do lote registrado.'

  // Auditoria não participa do cálculo; registra exatamente o antes/depois.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loteRaw, error: erroLote } = await (acesso.supabase as any)
    .from('importacao_lotes')
    .insert({
      barbearia_id: acesso.barbeariaId,
      usuario_id: acesso.usuarioId,
      arquivo_nome: preview.arquivoNome,
      arquivo_hash: preview.arquivoHash,
      tipo_valor: pedido.tipoValor,
      linhas_arquivo: preview.resumo.linhasArquivo,
      lancamentos_previstos: preview.linhas.length,
      lancamentos_aplicados: aplicacoes.length,
      lancamentos_ignorados: ignoradas.length,
      total_aplicado: totalAplicado,
      resumo: preview.resumo,
    })
    .select('id')
    .single()
  if (erroLote) {
    mensagemAuditoria = 'Dados lançados; não foi possível registrar o resumo do lote.'
  } else {
    loteId = (loteRaw as { id: string }).id
    const itens = [...aplicacoes, ...ignoradas].map(a => ({
      lote_id: loteId,
      barbearia_id: acesso.barbeariaId,
      barbeiro_id: a.linha.barbeiroId,
      data: a.linha.data,
      tipo_valor: pedido.tipoValor,
      valor_importado: a.linha.valorImportado,
      valor_anterior: a.linha.valorExistente,
      valor_final: a.valorFinal,
      acao: a.acao,
      status: a.acao === 'ignorar' ? 'ignorado' : 'aplicado',
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroItens } = await (acesso.supabase as any)
      .from('importacao_itens')
      .insert(itens)
    if (erroItens) mensagemAuditoria = 'Lote registrado, mas o detalhamento da auditoria falhou.'
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  revalidatePath('/dashboard/importar-dados')
  return {
    ok: true,
    loteId,
    aplicados: aplicacoes.length,
    ignorados: ignoradas.length,
    totalAplicado,
    mensagemAuditoria,
  }
}
