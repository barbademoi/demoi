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

  // ── 1. Salva lançamentos diários ───────────────────────────
  const rows = lancamentos
    .filter(l => l.valor >= 0)
    .map(l => ({
      barbearia_id,
      barbeiro_id:      l.barbeiro_id,
      data,
      valor:            l.valor,
      faturamento_geral: fatGeral >= 0 ? fatGeral : 0,
      atualizado_em:    agora,
    }))

  if (rows.length === 0) return { ok: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errDiario } = await (supabase as any)
    .from('lancamentos_diarios')
    .upsert(rows, { onConflict: 'barbeiro_id,data' })

  if (errDiario) return { error: (errDiario as { message: string }).message }

  // ── 2. Recalcula acumulado mensal para cada barbeiro ───────
  const [anoStr, mesStr] = data.split('-')
  const mes = parseInt(mesStr)
  const ano = parseInt(anoStr)
  const primeiroDiaMes = `${anoStr}-${mesStr}-01`
  // último dia do mês
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const ultimoDiaMes = `${anoStr}-${mesStr}-${String(ultimoDia).padStart(2, '0')}`

  const barbeirosIds = lancamentos.map(l => l.barbeiro_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: somasRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia_id)
    .in('barbeiro_id', barbeirosIds)
    .gte('data', primeiroDiaMes)
    .lte('data', ultimoDiaMes)

  // Agrupa soma por barbeiro
  const somaMap: Record<string, number> = {}
  for (const r of (somasRaw ?? []) as { barbeiro_id: string; valor: number }[]) {
    somaMap[r.barbeiro_id] = (somaMap[r.barbeiro_id] ?? 0) + Number(r.valor)
  }

  // Upsert em lancamentos (acumulado mensal)
  const lancRows = barbeirosIds.map(bid => ({
    barbearia_id,
    barbeiro_id:        bid,
    mes,
    ano,
    comissao_acumulada: somaMap[bid] ?? 0,
    modo:               'direto',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errAcum } = await (supabase as any)
    .from('lancamentos')
    .upsert(lancRows, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })

  if (errAcum) return { error: (errAcum as { message: string }).message }

  revalidatePath('/dashboard')
  return { ok: true }
}
