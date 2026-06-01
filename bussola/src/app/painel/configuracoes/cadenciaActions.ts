'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { Cadencia } from '@/lib/cadencia'

interface SalvarInput {
  cadencia: Cadencia
  dia_reuniao: number | null
  hora_reuniao: string
  dia_mes_reuniao: number | null
  incluir_domingos: boolean
}

export async function salvarCadencia(input: SalvarInput) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const { data: est } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('dono_id', user.id)
      .maybeSingle()
    if (!est) return { error: 'Sem empresa.' }

    if (!['diaria', 'semanal', 'quinzenal', 'mensal'].includes(input.cadencia)) {
      return { error: 'Cadência inválida.' }
    }
    if (!/^\d{2}:\d{2}/.test(input.hora_reuniao)) {
      return { error: 'Hora inválida.' }
    }
    if ((input.cadencia === 'semanal' || input.cadencia === 'quinzenal') && !input.dia_reuniao) {
      return { error: 'Escolha o dia da semana.' }
    }
    if (input.cadencia === 'mensal' && (!input.dia_mes_reuniao || input.dia_mes_reuniao < 1 || input.dia_mes_reuniao > 31)) {
      return { error: 'Escolha o dia do mês (1 a 31).' }
    }

    const update: Record<string, unknown> = {
      cadencia_reuniao: input.cadencia,
      hora_reuniao: input.hora_reuniao,
      dia_reuniao: input.cadencia === 'mensal' ? null : (input.dia_reuniao ?? 1),
      dia_mes_reuniao: input.cadencia === 'mensal' ? input.dia_mes_reuniao : null,
      incluir_domingos: input.cadencia === 'diaria' ? input.incluir_domingos : false,
    }

    const { error } = await supabase
      .from('estabelecimentos')
      .update(update)
      .eq('id', est.id)
    if (error) {
      console.error('[salvarCadencia]', error)
      return { error: 'Não foi possível salvar.' }
    }

    revalidatePath('/painel')
    revalidatePath('/painel/reuniao')
    revalidatePath('/painel/configuracoes')
    return { ok: true as const }
  } catch (err) {
    console.error('[salvarCadencia]', err)
    return { error: 'Erro interno.' }
  }
}
