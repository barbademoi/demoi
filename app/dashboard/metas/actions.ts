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

  // Upsert meta coletiva
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingMeta } = await (supabase as any)
    .from('metas')
    .select('id')
    .eq('barbearia_id', usuario.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  let meta_id: string

  if (existingMeta) {
    meta_id = (existingMeta as { id: string }).id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('metas')
      .update({ meta_coletiva, premio_coletivo, faturamento_acumulado })
      .eq('id', meta_id)
    if (error) return { error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newMeta, error } = await (supabase as any)
      .from('metas')
      .insert({ barbearia_id: usuario.barbearia_id, mes, ano, meta_coletiva, premio_coletivo, faturamento_acumulado })
      .select('id')
      .single()
    if (error) return { error: error.message }
    meta_id = (newMeta as { id: string }).id
  }

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
    // Check if meta individual already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('metas_individuais')
      .select('id')
      .eq('meta_id', meta_id)
      .eq('barbeiro_id', b.id)
      .single()

    if (existing) {
      // Update comm values (always exists)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('metas_individuais')
        .update({ bronze_comm: b.bronze_comm, prata_comm: b.prata_comm, ouro_comm: b.ouro_comm })
        .eq('id', (existing as { id: string }).id)
      if (error) return { error: error.message }

      // Try to update prize values (silently skip if columns don't exist yet)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('metas_individuais')
        .update({
          bronze_premio: b.bronze_premio || null,
          prata_premio: b.prata_premio || null,
          ouro_premio: b.ouro_premio || null,
        })
        .eq('id', (existing as { id: string }).id)
    } else {
      // Insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('metas_individuais')
        .insert({
          meta_id,
          barbeiro_id: b.id,
          bronze_comm: b.bronze_comm,
          prata_comm: b.prata_comm,
          ouro_comm: b.ouro_comm,
        })
      if (error) return { error: error.message }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/cards')
  return { ok: true }
}
