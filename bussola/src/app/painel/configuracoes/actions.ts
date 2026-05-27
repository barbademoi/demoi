'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { ConfigIA, TomIA } from '@/lib/iaPrompts'

const TONS: TomIA[] = ['direto', 'acolhedor', 'motivacional']

export async function salvarConfigIA(config: ConfigIA) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const limpo: ConfigIA = {
      tom: TONS.includes(config.tom) ? config.tom : 'direto',
      categorizacao_auto: !!config.categorizacao_auto,
      resumo_semana: !!config.resumo_semana,
      dicas_blocos: !!config.dicas_blocos,
    }

    const { error } = await supabase.from('estabelecimentos').update({ config_ia: limpo }).eq('dono_id', user.id)
    if (error) return { error: 'Não foi possível salvar.' }

    revalidatePath('/painel/configuracoes')
    revalidatePath('/painel/reuniao')
    return { ok: true }
  } catch (err) {
    console.error('[salvarConfigIA]', err)
    return { error: 'Erro interno.' }
  }
}

export interface VisibilidadeConfig {
  mostrar_negativos_profissional: boolean
  mostrar_observacoes_profissional: boolean
  atraso_negativo_minutos: number
}

export async function salvarVisibilidade(config: VisibilidadeConfig) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado.' }

    const atraso = Math.round(Number(config.atraso_negativo_minutos))
    const limpo: VisibilidadeConfig = {
      mostrar_negativos_profissional: !!config.mostrar_negativos_profissional,
      mostrar_observacoes_profissional: !!config.mostrar_observacoes_profissional,
      atraso_negativo_minutos: Number.isFinite(atraso) ? Math.min(Math.max(atraso, 0), 1440) : 5,
    }

    const { error } = await supabase.from('estabelecimentos').update(limpo).eq('dono_id', user.id)
    if (error) return { error: 'Não foi possível salvar.' }

    revalidatePath('/painel/configuracoes')
    return { ok: true }
  } catch (err) {
    console.error('[salvarVisibilidade]', err)
    return { error: 'Erro interno.' }
  }
}
