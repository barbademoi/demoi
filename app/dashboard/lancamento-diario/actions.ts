'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { estaFechado } from '@/lib/mesFechado'
import { cicloDeData } from '@/lib/ciclo'

interface ComandaItem {
  barbeiro_id: string
  comandas: number
}

/**
 * Lança as COMANDAS (atendimentos) de um dia, por barbeiro.
 *
 * NÃO mexe em valores (R$) — comissão e faturamento só são editados no
 * acumulado (definirAcumuladoMes), pra evitar erro de matemática entre
 * delta diário e ajuste manual.
 *
 * As comandas SOMAM nos atendimentos do mês:
 *   - lancamentos.numero_atendimentos (por barbeiro)
 *   - metas.numero_atendimentos (total da casa = soma de todos)
 * via delta (novo valor do dia − valor anterior do dia).
 */
export async function salvarComandasDia(
  comandas: ComandaItem[],
  data: string,         // 'YYYY-MM-DD'
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id, barbearias(dia_fechamento)').eq('id', user.id).single() as
    { data: { barbearia_id: string; barbearias: { dia_fechamento: number | null } | null } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const { barbearia_id } = usuario
  const agora = new Date().toISOString()
  const barbeirosIds = comandas.map(l => l.barbeiro_id)

  // mes/ano = INÍCIO do ciclo que contém a data, respeitando dia_fechamento.
  // NÃO usar data.split('-') direto — quebra em barbearias com ciclo cruzando
  // meses (ex: dia 26 ao 25): comandas iriam pra (mes, ano) errado em
  // lancamentos e metas, desalinhando do dashboard.
  const diaFechamento = usuario.barbearias?.dia_fechamento ?? 1
  const ciclo = cicloDeData(new Date(data + 'T12:00:00'), diaFechamento)
  const mes = ciclo.mesRef
  const ano = ciclo.anoRef

  const trava = await estaFechado(supabase, barbearia_id, mes, ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de lançar.' }

  // ── 1. Comandas anteriores do dia (pra calcular delta) ────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevDiasRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, numero_atendimentos')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .eq('data', data)

  const prevComandasMap: Record<string, number> = {}
  for (const r of (prevDiasRaw ?? []) as { barbeiro_id: string; numero_atendimentos: number }[]) {
    prevComandasMap[r.barbeiro_id] = Number(r.numero_atendimentos) || 0
  }

  // ── 2. Atendimentos acumulados atuais (por barbeiro) ──────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevAcumRaw } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, numero_atendimentos')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .eq('mes', mes)
    .eq('ano', ano)

  const accumAtendMap: Record<string, number> = {}
  for (const r of (prevAcumRaw ?? []) as { barbeiro_id: string; numero_atendimentos: number }[]) {
    accumAtendMap[r.barbeiro_id] = Number(r.numero_atendimentos) || 0
  }

  // ── 3. Salva comandas do dia (lancamentos_diarios) ────────
  const rowsDia = comandas.map(l => ({
    barbearia_id,
    barbeiro_id:         l.barbeiro_id,
    data,
    numero_atendimentos: Math.max(0, l.comandas),
    atualizado_em:       agora,
  }))

  if (rowsDia.length === 0) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errDiario } = await (supabase as any)
    .from('lancamentos_diarios')
    .upsert(rowsDia, { onConflict: 'barbeiro_id,data' })

  if (errDiario) return { error: (errDiario as { message: string }).message }

  // ── 4. Atualiza atendimentos acumulados por barbeiro (delta) ──
  // Preserva comissao_acumulada existente (não envia esse campo no upsert).
  let somaDeltas = 0
  const lancRows = comandas
    .map(l => {
      const prevDia = prevComandasMap[l.barbeiro_id] ?? 0
      const novo = Math.max(0, l.comandas)
      const delta = novo - prevDia
      if (delta === 0) return null
      somaDeltas += delta
      const novoAcum = Math.max(0, (accumAtendMap[l.barbeiro_id] ?? 0) + delta)
      return {
        barbearia_id,
        barbeiro_id:         l.barbeiro_id,
        mes,
        ano,
        numero_atendimentos: novoAcum,
        modo:                'direto',
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (lancRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errAcum } = await (supabase as any)
      .from('lancamentos')
      .upsert(lancRows, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })
    if (errAcum) return { error: (errAcum as { message: string }).message }
  }

  // ── 5. Atualiza atendimentos totais da casa (metas) ───────
  if (somaDeltas !== 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: metaRaw } = await (supabase as any)
      .from('metas')
      .select('id, numero_atendimentos')
      .eq('barbearia_id', barbearia_id)
      .eq('mes', mes)
      .eq('ano', ano)
      .maybeSingle() as { data: { id: string; numero_atendimentos: number } | null }

    if (metaRaw) {
      const novoAtend = Math.max(0, Number(metaRaw.numero_atendimentos) + somaDeltas)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('metas')
        .update({ numero_atendimentos: novoAtend })
        .eq('id', metaRaw.id)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  return { ok: true }
}

/**
 * Busca as comandas (número de atendimentos) de uma data específica, por
 * barbeiro. Usado pelo seletor de data quando o dono pula pra um dia fora
 * do ciclo carregado pelo servidor — pra pré-preencher o form.
 */
export async function buscarComandasDia(data: string): Promise<
  { porBarbeiro: Record<string, number> } | { error: string }
> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, numero_atendimentos')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('data', data)

  const porBarbeiro: Record<string, number> = {}
  for (const r of (rows ?? []) as { barbeiro_id: string; numero_atendimentos: number }[]) {
    porBarbeiro[r.barbeiro_id] = Number(r.numero_atendimentos) || 0
  }
  return { porBarbeiro }
}

interface AcumuladoItem {
  barbeiro_id: string
  /** R$ faturado pelo barbeiro no mes. null = nao envia (modo nao captura). */
  valor_faturamento: number | null
  /** R$ de comissao do barbeiro no mes. null = nao envia (modo nao captura). */
  valor_comissao: number | null
  numero_atendimentos: number
}

/**
 * Define/edita o ACUMULADO do mês (tela principal):
 *   - valor_faturamento e/ou valor_comissao por barbeiro (R$, conforme
 *     barbearias.modo_meta)
 *   - comissao_acumulada e' espelhada do valor_base (faturamento ou comissao,
 *     conforme barbearias.base_meta) — e' a chave do ranking/historico legado
 *   - atendimentos acumulados por barbeiro
 *   - faturamento acumulado + atendimentos totais da casa (tabela metas)
 *
 * Sobrescreve direto (não soma). Os valores nao enviados (null) ficam
 * preservados — o upsert so atualiza as colunas presentes.
 */
export async function definirAcumuladoMes(
  itens: AcumuladoItem[],
  faturamentoCasa: number,
  atendimentosCasa: number,
  mes: number,
  ano: number,
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const { barbearia_id } = usuario

  const trava = await estaFechado(supabase, barbearia_id, mes, ano)
  if (trava.fechado) return { error: 'Mês fechado. Reabra antes de editar.' }

  // Le modo_meta + base_meta da barbearia pra decidir qual valor (faturamento
  // ou comissao) espelhar em comissao_acumulada — a chave de ranking/historico.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cfgRaw } = await (supabase as any)
    .from('barbearias')
    .select('modo_meta, base_meta')
    .eq('id', barbearia_id)
    .single() as { data: { modo_meta: string | null; base_meta: string | null } | null }

  const modoMeta = (cfgRaw?.modo_meta ?? 'comissao') as 'faturamento' | 'comissao' | 'ambos'
  const baseRaw = (cfgRaw?.base_meta ?? 'comissao') as 'faturamento' | 'comissao'
  // base efetivo: pra modo simples espelha o proprio modo; pra 'ambos' usa base_meta.
  const base: 'faturamento' | 'comissao' = modoMeta === 'ambos'
    ? baseRaw
    : (modoMeta as 'faturamento' | 'comissao')

  // 1. Upsert valor_faturamento/valor_comissao + comissao_acumulada (espelho do base)
  //    + atendimentos por barbeiro.
  //    Quando um valor vem null (modo nao captura), preserva o que ja estava
  //    no banco — nao envia o campo.
  const rowsLanc = itens.map(it => {
    const fat = it.valor_faturamento != null ? Math.max(0, it.valor_faturamento) : null
    const com = it.valor_comissao != null ? Math.max(0, it.valor_comissao) : null
    const espelho = base === 'faturamento' ? fat : com
    const row: Record<string, unknown> = {
      barbearia_id,
      barbeiro_id: it.barbeiro_id,
      mes,
      ano,
      numero_atendimentos: Math.max(0, it.numero_atendimentos),
      modo: 'direto',
    }
    if (fat != null) row.valor_faturamento = fat
    if (com != null) row.valor_comissao = com
    if (espelho != null) row.comissao_acumulada = espelho
    return row
  })

  if (rowsLanc.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errLanc } = await (supabase as any)
      .from('lancamentos')
      .upsert(rowsLanc, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })
    if (errLanc) return { error: (errLanc as { message: string }).message }
  }

  // 2. Faturamento + atendimentos da casa (metas) — só atualiza se a meta já existe.
  //    Atendimentos da casa = campo coletivo editado direto pelo dono.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id')
    .eq('barbearia_id', barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle() as { data: { id: string } | null }

  if (metaRaw) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errMeta } = await (supabase as any)
      .from('metas')
      .update({
        faturamento_acumulado: Math.max(0, faturamentoCasa),
        numero_atendimentos: Math.max(0, atendimentosCasa),
      })
      .eq('id', metaRaw.id)
    if (errMeta) return { error: (errMeta as { message: string }).message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  return { ok: true }
}
