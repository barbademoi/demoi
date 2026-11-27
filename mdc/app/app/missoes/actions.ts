'use server'

import { revalidatePath } from 'next/cache'
import { buscarMembro, semanaDoMembro, statusExibido } from '@/lib/membro'
import { hojeSP } from '@/lib/format'

async function contexto() {
  const { supabase, user, membro } = await buscarMembro()
  if (!user || !membro) throw new Error('Sessão expirada. Entre de novo.')
  const st = statusExibido(membro)
  if (st !== 'ativo' && st !== 'vence_em_breve') throw new Error('Seu acesso não está ativo.')
  const semana = semanaDoMembro(membro.data_inicio)
  if (semana < 1) throw new Error('Sua jornada ainda não começou.')
  return { supabase, uid: user.id, semana }
}

/** Marca/desmarca. O RLS do banco confere se o item está liberado. */
export async function marcar(templateId: string, tipo: 'habito_diario' | 'missao_semana', marcado: boolean) {
  const { supabase, uid, semana } = await contexto()
  const dia = tipo === 'habito_diario' ? hojeSP() : null
  if (marcado) {
    const { error } = await supabase.from('mission_logs').insert({ member_id: uid, template_id: templateId, dia, semana })
    if (error && error.code !== '23505') throw new Error('Não deu pra marcar.')
  } else {
    let q = supabase.from('mission_logs').delete().eq('member_id', uid).eq('template_id', templateId)
    q = dia ? q.eq('dia', dia) : q.is('dia', null).eq('semana', semana)
    const { error } = await q
    if (error) throw new Error('Não deu pra desmarcar.')
  }
  revalidatePath('/app')
}

/** Observação da missão da semana (marca a missão se ainda não estiver). */
export async function salvarObservacao(templateId: string, texto: string) {
  const { supabase, uid, semana } = await contexto()
  const observacao = texto.trim().slice(0, 1000) || null
  const { data } = await supabase
    .from('mission_logs')
    .select('id')
    .eq('member_id', uid)
    .eq('template_id', templateId)
    .is('dia', null)
    .eq('semana', semana)
    .maybeSingle()
  if (!data && !observacao) return
  const { error } = data
    ? await supabase.from('mission_logs').update({ observacao }).eq('id', data.id)
    : await supabase.from('mission_logs').insert({ member_id: uid, template_id: templateId, dia: null, semana, observacao })
  if (error) throw new Error('Não deu pra salvar.')
}
