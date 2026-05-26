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
      mensagens_personalizadas: !!config.mensagens_personalizadas,
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
