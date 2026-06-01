'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getBarbeariaId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single()
  return (data as { barbearia_id: string } | null)?.barbearia_id ?? null
}

/**
 * Marca um mês como fechado pra barbearia do dono. Bloqueia edições
 * (metas, campanha, comandas, acumulado) até reabrir.
 */
export async function fecharMes(mes: number, ano: number) {
  if (mes < 1 || mes > 12 || ano < 2024) {
    return { error: 'Período inválido.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Barbearia não encontrada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('meses_fechados')
    .upsert({
      barbearia_id: barbeariaId,
      mes,
      ano,
      fechado_em: new Date().toISOString(),
      fechado_por: user.id,
    }, { onConflict: 'barbearia_id,mes,ano' })

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  revalidatePath('/cards')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}

/**
 * Reabre um mês fechado.
 */
export async function reabrirMes(mes: number, ano: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }
  const barbeariaId = await getBarbeariaId()
  if (!barbeariaId) return { error: 'Barbearia não encontrada.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('meses_fechados')
    .delete()
    .eq('barbearia_id', barbeariaId)
    .eq('mes', mes)
    .eq('ano', ano)

  if (error) return { error: (error as { message: string }).message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/lancamento-diario')
  revalidatePath('/cards')
  revalidatePath('/b/[codigo]', 'page')
  return { ok: true }
}
