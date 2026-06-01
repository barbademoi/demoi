'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const { barbearia_id } = usuario
  const agora = new Date().toISOString()
  const barbeirosIds = comandas.map(l => l.barbeiro_id)

  const [anoStr, mesStr] = data.split('-')
  const mes = parseInt(mesStr)
  const ano = parseInt(anoStr)

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
  comissao_acumulada: number
  numero_atendimentos: number
}

/**
 * Define/edita o ACUMULADO do mês (tela principal):
 *   - comissão acumulada por barbeiro (R$)
 *   - atendimentos acumulados por barbeiro (lancamentos — ticket individual)
 *   - faturamento acumulado da casa (R$)
 *   - atendimentos totais da casa (metas — ticket coletivo). É um campo
 *     próprio, editado direto pelo dono (não é a soma dos barbeiros), pra
 *     barbearias que só lançam o total da casa sem detalhar por barbeiro.
 *
 * Sobrescreve direto (não soma). Os campos de atendimento são
 * pré-preenchidos na UI com o valor atual, então re-salvar sem mexer
 * não altera nada. As comandas do dia (salvarComandasDia) continuam
 * somando em cima depois.
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

  // 1. Upsert comissão + atendimentos acumulados por barbeiro
  const rowsLanc = itens.map(it => ({
    barbearia_id,
    barbeiro_id: it.barbeiro_id,
    mes,
    ano,
    comissao_acumulada: Math.max(0, it.comissao_acumulada),
    numero_atendimentos: Math.max(0, it.numero_atendimentos),
    modo: 'direto',
  }))

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
