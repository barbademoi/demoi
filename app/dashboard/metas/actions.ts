'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function salvarMetas(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string } | null }

  if (!usuario) return { error: 'Barbearia não encontrada.' }

  const mes = parseInt(formData.get('mes') as string)
  const ano = parseInt(formData.get('ano') as string)
  const meta_coletiva = parseFloat(formData.get('meta_coletiva') as string) || 0
  const premio_coletivo = formData.get('premio_coletivo') as string
  const faturamento_acumulado = parseFloat(formData.get('faturamento_acumulado') as string) || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaResult, error: metaError } = await (supabase as any)
    .from('metas')
    .upsert(
      { barbearia_id: usuario.barbearia_id, mes, ano, meta_coletiva, premio_coletivo, faturamento_acumulado },
      { onConflict: 'barbearia_id,mes,ano' }
    )
    .select('id')
    .single()

  if (metaError) return { error: metaError.message }
  const meta_id = (metaResult as { id: string }).id

  const barbeiros = JSON.parse(formData.get('barbeiros') as string) as {
    id: string
    bronze_comm: number
    prata_comm: number
    ouro_comm: number
    bronze_premio: string
    prata_premio: string
    ouro_premio: string
  }[]

  for (const b of barbeiros) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('metas_individuais')
      .upsert(
        {
          meta_id,
          barbeiro_id: b.id,
          bronze_comm: b.bronze_comm,
          prata_comm: b.prata_comm,
          ouro_comm: b.ouro_comm,
          bronze_premio: b.bronze_premio || null,
          prata_premio: b.prata_premio || null,
          ouro_premio: b.ouro_premio || null,
        },
        { onConflict: 'meta_id,barbeiro_id' }
      )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
