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
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .eq('data', data)

  const prevValorMap: Record<string, number> = {}
  for (const r of (prevDiasRaw ?? []) as { barbeiro_id: string; valor: number }[]) {
    prevValorMap[r.barbeiro_id] = Number(r.valor)
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
  // Só aplica o delta → preserva lançamentos manuais existentes
  const lancRows = lancamentos.map(l => {
    const prevDia = prevValorMap[l.barbeiro_id] ?? 0
    const delta   = l.valor - prevDia
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errAcum } = await (supabase as any)
    .from('lancamentos')
    .upsert(lancRows, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })

  if (errAcum) return { error: (errAcum as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}
