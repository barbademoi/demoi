'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface LancamentoItem {
  barbeiro_id: string
  valor: number
}

export async function salvarLancamentosDiarios(
  lancamentos: LancamentoItem[],
  data: string,         // 'YYYY-MM-DD'
  fatGeral: number,
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
  const barbeirosIds = lancamentos.map(l => l.barbeiro_id)

  const [anoStr, mesStr] = data.split('-')
  const mes = parseInt(mesStr)
  const ano = parseInt(anoStr)

  // ── 1. Valores anteriores do dia (antes do upsert) ────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevDiasRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor, faturamento_geral')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .eq('data', data)

  const prevValorMap: Record<string, number> = {}
  let prevFatGeral = 0
  for (const r of (prevDiasRaw ?? []) as { barbeiro_id: string; valor: number; faturamento_geral: number }[]) {
    prevValorMap[r.barbeiro_id] = Number(r.valor)
    prevFatGeral = Math.max(prevFatGeral, Number(r.faturamento_geral))
  }

  // ── 2. Acumulado mensal atual ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevAcumRaw } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .eq('mes', mes)
    .eq('ano', ano)

  const accumMap: Record<string, number> = {}
  for (const r of (prevAcumRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    accumMap[r.barbeiro_id] = Number(r.comissao_acumulada)
  }

  // ── 3. Salva lançamentos diários ──────────────────────────
  const rows = lancamentos
    .filter(l => l.valor >= 0)
    .map(l => ({
      barbearia_id,
      barbeiro_id:       l.barbeiro_id,
      data,
      valor:             l.valor,
      faturamento_geral: fatGeral >= 0 ? fatGeral : 0,
      atualizado_em:     agora,
    }))

  if (rows.length === 0) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errDiario } = await (supabase as any)
    .from('lancamentos_diarios')
    .upsert(rows, { onConflict: 'barbeiro_id,data' })

  if (errDiario) return { error: (errDiario as { message: string }).message }

  // ── 4. Atualiza acumulado: acum + (novo - anterior) ──────
  // Só processa barbeiros com delta != 0 — preserva acumulado manual
  // e evita redução indevida quando usuario deixa campo em branco
  const lancRows = lancamentos
    .map(l => {
      const prevDia = prevValorMap[l.barbeiro_id] ?? 0
      const delta   = l.valor - prevDia
      if (delta === 0) return null
      const novoAcum = Math.max(0, (accumMap[l.barbeiro_id] ?? 0) + delta)
      return {
        barbearia_id,
        barbeiro_id:        l.barbeiro_id,
        mes,
        ano,
        comissao_acumulada: novoAcum,
        modo:               'direto',
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

  // ── 5. Atualiza faturamento_acumulado da meta coletiva ────
  const fatGeralNovo = fatGeral >= 0 ? fatGeral : 0
  const fatGeralDelta = fatGeralNovo - prevFatGeral

  if (fatGeralDelta !== 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: metaRaw } = await (supabase as any)
      .from('metas')
      .select('id, faturamento_acumulado')
      .eq('barbearia_id', barbearia_id)
      .eq('mes', mes)
      .eq('ano', ano)
      .single() as { data: { id: string; faturamento_acumulado: number } | null }

    if (metaRaw) {
      const novoFat = Math.max(0, Number(metaRaw.faturamento_acumulado) + fatGeralDelta)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('metas')
        .update({ faturamento_acumulado: novoFat })
        .eq('id', metaRaw.id)
    }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

interface SaldoBarbeiroItem {
  barbeiro_id: string
  comissao_acumulada: number
  numero_atendimentos: number
}

/**
 * Define o saldo do mês — usado quando a barbearia compra o sistema
 * no meio do mês e quer começar do "estado atual" sem precisar lançar
 * cada dia retroativamente. Também serve como ajuste manual.
 *
 * Sobrescreve em `lancamentos` (acumulado mensal) e `metas`
 * (faturamento + atendimentos coletivos). NÃO mexe em lancamentos_diarios.
 *
 * Depois desse ajuste, os lançamentos diários continuam funcionando
 * normalmente (somando deltas em cima do saldo).
 */
export async function definirSaldoMes(
  itens: SaldoBarbeiroItem[],
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

  // 1. Upsert lancamentos (por barbeiro)
  const rowsLanc = itens
    .filter(it => it.comissao_acumulada >= 0 || it.numero_atendimentos >= 0)
    .map(it => ({
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

  // 2. Upsert metas (faturamento + atendimentos da casa) — só atualiza se já existe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id')
    .eq('barbearia_id', barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle() as { data: { id: string } | null }

  if (metaRaw && (faturamentoCasa >= 0 || atendimentosCasa >= 0)) {
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
