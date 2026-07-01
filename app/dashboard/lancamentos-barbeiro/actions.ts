'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cicloDeData, cicloAtual, hojeBrasil } from '@/lib/ciclo'

interface ServicoLancado { servico_id: string; quantidade: number }

/**
 * Confere se o dono logado pode mexer no barbeiro alvo (mesma barbearia).
 * Retorna `{ barbeariaId, barbeiroId, diaFechamento }` ou `{ error }`.
 */
async function autorizarDono(barbeiroId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id, barbearias(dia_fechamento)').eq('id', user.id).single() as
    { data: { barbearia_id: string; barbearias: { dia_fechamento: number | null } | null } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiro } = await (supabase as any)
    .from('barbeiros').select('barbearia_id, link_codigo').eq('id', barbeiroId).single() as
    { data: { barbearia_id: string; link_codigo: string } | null }
  if (!barbeiro) return { error: 'Barbeiro não encontrado.' as const }
  if (barbeiro.barbearia_id !== usuario.barbearia_id) return { error: 'Sem permissão.' as const }

  const diaFechamento = usuario.barbearias?.dia_fechamento ?? 1
  return {
    supabase,
    barbeariaId: usuario.barbearia_id,
    linkCodigo: barbeiro.link_codigo,
    diaFechamento,
  }
}

/**
 * Lança ou edita os serviços de um dia inteiro pra um barbeiro, agindo como dono.
 * Pra cada serviço:
 *   - quantidade > 0 e registro novo → INSERT (lancado_por='dono')
 *   - quantidade > 0 e registro existe → UPDATE (editado_por='dono', editado_em=now())
 *   - quantidade = 0 → DELETE
 *
 * Preserva o lancado_por original quando edita (mantém quem criou).
 */
export async function lancarDiaComoDono(params: {
  barbeiroId: string
  data: string            // 'YYYY-MM-DD'
  servicos: ServicoLancado[]
}) {
  const auth = await autorizarDono(params.barbeiroId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId, linkCodigo, diaFechamento } = auth

  // mes/ano = início do ciclo que contém a data, respeitando dia_fechamento.
  // NÃO usar getMonth() direto — quebra em barbearias com ciclo cruzando meses
  // (ex: 26→25): a campanha está salva em mesRef, e o lookup por mês calendário
  // erra ~75% dos dias.
  const ciclo = cicloDeData(new Date(params.data + 'T12:00:00'), diaFechamento)
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campRaw } = await (supabase as any)
    .from('campanha').select('id, ativo')
    .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle() as
    { data: { id: string; ativo: boolean } | null }
  if (!campRaw) return { error: 'Campanha não encontrada para este mês.' }
  if (campRaw.ativo === false) return { error: 'Campanha inativa neste mês.' }

  const campanha_id = campRaw.id
  const agora = new Date().toISOString()

  // Busca o que já existe pra esse dia/barbeiro (pra saber INSERT vs UPDATE)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existRaw } = await (supabase as any)
    .from('controle_diario')
    .select('id, servico_id')
    .eq('barbeiro_id', params.barbeiroId)
    .eq('data', params.data)
  const existePorServico = new Map<string, string>()
  for (const r of (existRaw ?? []) as { id: string; servico_id: string }[]) {
    existePorServico.set(r.servico_id, r.id)
  }

  for (const s of params.servicos) {
    const idExistente = existePorServico.get(s.servico_id)

    if (s.quantidade <= 0) {
      if (idExistente) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('controle_diario').delete().eq('id', idExistente)
      }
      continue
    }

    if (idExistente) {
      // UPDATE — preserva lancado_por original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .update({
          quantidade: s.quantidade,
          editado_por: 'dono',
          editado_em: agora,
        })
        .eq('id', idExistente)
    } else {
      // INSERT — dono criou
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('controle_diario')
        .insert({
          barbeiro_id: params.barbeiroId,
          campanha_id,
          data: params.data,
          servico_id: s.servico_id,
          quantidade: s.quantidade,
          lancado_por: 'dono',
        })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/b/${linkCodigo}`)
  return { ok: true }
}

export interface LancamentoDiaItem {
  servico_id: string
  servico_nome: string
  quantidade: number
  pontos_unitario: number
  pontos_total: number
  lancado_por: 'barbeiro' | 'dono'
  editado_por: 'barbeiro' | 'dono' | null
  editado_em: string | null
}

export interface LancamentoDia {
  data: string                 // 'YYYY-MM-DD'
  totalPontos: number
  servicos: LancamentoDiaItem[]
}

/**
 * Busca os lançamentos de pontos de um barbeiro num INTERVALO de datas
 * arbitrário (inclusivo nas duas pontas). Datas em 'YYYY-MM-DD' já no fuso
 * do dono (BRT) — a coluna `controle_diario.data` é `date` (sem fuso), então
 * o agrupamento por dia bate certo se quem grava usar `dataLocalStr` (BRT).
 *
 * Usado tanto pelo modal "Ver lançamentos" (janela fixa de 30 dias) quanto
 * pela tela `/dashboard/historico-lancamentos` (intervalo livre).
 *
 * Retorna também a lista de serviços ATIVOS da campanha do ciclo ATUAL —
 * mesmo que o intervalo selecionado seja passado, "Adicionar lançamento"
 * precisa dos serviços do ciclo onde a edição seria salva.
 */
export async function buscarLancamentosBarbeiroIntervalo(
  barbeiroId: string,
  inicioIso: string,
  fimIso: string,
) {
  const auth = await autorizarDono(barbeiroId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId, diaFechamento } = auth

  // Validação leve do intervalo. Limite máximo de 366 dias pra não explodir.
  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(inicioIso) || !re.test(fimIso)) return { error: 'Datas inválidas.' as const }
  if (inicioIso > fimIso) return { error: 'Data inicial maior que a final.' as const }
  const inicio = new Date(inicioIso + 'T12:00:00')
  const fim = new Date(fimIso + 'T12:00:00')
  const diasNoIntervalo = Math.round((fim.getTime() - inicio.getTime()) / 86400000) + 1
  if (diasNoIntervalo > 366) return { error: 'Intervalo máximo: 12 meses.' as const }

  // Campanha do ciclo ATUAL (pra resolver serviços do form de "Adicionar").
  const hoje = hojeBrasil()
  const cicloHoje = cicloAtual(diaFechamento, hoje)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campAtualRaw } = await (supabase as any)
    .from('campanha').select('id, ativo')
    .eq('barbearia_id', barbeariaId).eq('mes', cicloHoje.mesRef).eq('ano', cicloHoje.anoRef).maybeSingle() as
    { data: { id: string; ativo: boolean } | null }

  // Serviços de TODAS as campanhas da barbearia — controles podem referenciar
  // servico_id de campanha de qualquer ciclo dentro do intervalo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campanhasRaw } = await (supabase as any)
    .from('campanha').select('id').eq('barbearia_id', barbeariaId)
  const campanhaIds = ((campanhasRaw ?? []) as { id: string }[]).map(c => c.id)

  let servicos: { id: string; nome: string; pontos: number; campanha_id: string }[] = []
  if (campanhaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: servRaw } = await (supabase as any)
      .from('campanha_servicos')
      .select('id, nome, pontos, campanha_id')
      .in('campanha_id', campanhaIds)
    servicos = (servRaw ?? []) as typeof servicos
  }

  // Controles do barbeiro no intervalo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: controlesRaw } = await (supabase as any)
    .from('controle_diario')
    .select('data, servico_id, quantidade, lancado_por, editado_por, editado_em')
    .eq('barbeiro_id', barbeiroId)
    .gte('data', inicioIso)
    .lte('data', fimIso)
    .order('data', { ascending: false })

  const linhas = (controlesRaw ?? []) as Array<{
    data: string; servico_id: string; quantidade: number
    lancado_por: 'barbeiro' | 'dono'
    editado_por: 'barbeiro' | 'dono' | null
    editado_em: string | null
  }>

  // Agrupa por dia. `r.data` já é string 'YYYY-MM-DD' direto da coluna `date`.
  const porDia = new Map<string, LancamentoDia>()
  for (const r of linhas) {
    const serv = servicos.find(s => s.id === r.servico_id)
    const pontosUnit = serv?.pontos ?? 0
    const pontosTotal = pontosUnit * r.quantidade
    const item: LancamentoDiaItem = {
      servico_id: r.servico_id,
      servico_nome: serv?.nome ?? '?',
      quantidade: r.quantidade,
      pontos_unitario: pontosUnit,
      pontos_total: pontosTotal,
      lancado_por: r.lancado_por,
      editado_por: r.editado_por,
      editado_em: r.editado_em,
    }
    const dia = porDia.get(r.data) ?? { data: r.data, totalPontos: 0, servicos: [] }
    dia.servicos.push(item)
    dia.totalPontos += pontosTotal
    porDia.set(r.data, dia)
  }

  const dias: LancamentoDia[] = Array.from(porDia.values()).sort((a, b) => b.data.localeCompare(a.data))
  const totalPontosPeriodo = dias.reduce((s, d) => s + d.totalPontos, 0)

  const servicosCampanhaAtual = campAtualRaw?.id
    ? servicos.filter(s => s.campanha_id === campAtualRaw.id).map(s => ({ id: s.id, nome: s.nome, pontos: s.pontos }))
    : []

  return {
    ok: true as const,
    dias,
    totalPontosPeriodo,
    servicosCampanhaAtual,
    campanhaAtualAtiva: campAtualRaw?.ativo !== false && !!campAtualRaw?.id,
  }
}

/**
 * Busca os lançamentos de pontos de um barbeiro nos últimos 30 dias.
 * Wrapper sobre `buscarLancamentosBarbeiroIntervalo` mantido pra compat
 * com o modal "Ver lançamentos" no dashboard.
 */
export async function buscarLancamentosBarbeiro30Dias(barbeiroId: string) {
  const hoje = hojeBrasil()
  const ha30 = new Date(hoje)
  ha30.setDate(ha30.getDate() - 30)
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const res = await buscarLancamentosBarbeiroIntervalo(barbeiroId, toIso(ha30), toIso(hoje))
  if ('error' in res) return res
  // Mantém o shape antigo (sem totalPontosPeriodo) pra não quebrar o modal.
  return {
    ok: true as const,
    dias: res.dias,
    servicosCampanhaAtual: res.servicosCampanhaAtual,
    campanhaAtualAtiva: res.campanhaAtualAtiva,
  }
}

/**
 * Apaga TODOS os lançamentos de um barbeiro num dia.
 * Usado pelo botão ✕ ao lado do total do dia.
 */
export async function excluirLancamentoDia(barbeiroId: string, data: string) {
  const auth = await autorizarDono(barbeiroId)
  if ('error' in auth) return { error: auth.error }
  const { supabase, linkCodigo } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('controle_diario')
    .delete()
    .eq('barbeiro_id', barbeiroId)
    .eq('data', data)

  revalidatePath('/dashboard')
  revalidatePath(`/b/${linkCodigo}`)
  return { ok: true }
}
