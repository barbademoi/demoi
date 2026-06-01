'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function exigirDono() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' as const }
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) return { error: 'Sem empresa.' as const }
  return { supabase, estId: est.id as string }
}

interface PassoInput {
  numero: number
  titulo: string | null
  conteudo: string
  dica: string | null
}

export async function salvarTutorial(input: {
  id: string
  titulo: string
  descricao_curta: string | null
  passos: PassoInput[]
}) {
  try {
    const r = await exigirDono()
    if ('error' in r) return r
    const { supabase } = r

    const passosLimpos = input.passos
      .map((p, i) => ({
        numero: i + 1,
        titulo: p.titulo?.trim() || null,
        conteudo: (p.conteudo ?? '').trim(),
        dica: p.dica?.trim() || null,
      }))
      .filter((p) => p.conteudo.length > 0)

    if (passosLimpos.length === 0) return { error: 'O tutorial precisa de pelo menos 1 passo.' }
    if (!input.titulo.trim()) return { error: 'Título obrigatório.' }

    const { error: uErr } = await supabase
      .from('tutoriais')
      .update({
        titulo: input.titulo.trim(),
        descricao_curta: input.descricao_curta?.trim() || null,
      })
      .eq('id', input.id)
    if (uErr) return { error: 'Não foi possível salvar o tutorial.' }

    const { error: delErr } = await supabase
      .from('tutorial_passos')
      .delete()
      .eq('tutorial_id', input.id)
    if (delErr) return { error: 'Não foi possível atualizar os passos.' }

    const { error: insErr } = await supabase
      .from('tutorial_passos')
      .insert(passosLimpos.map((p) => ({ tutorial_id: input.id, ...p })))
    if (insErr) return { error: 'Não foi possível salvar os novos passos.' }

    revalidatePath('/painel/configuracoes/tutoriais')
    revalidatePath(`/painel/configuracoes/tutoriais/${input.id}`)
    revalidatePath(`/painel/tutoriais/${input.id}`)
    revalidatePath('/painel/tutoriais')
    return { ok: true as const }
  } catch (err) {
    console.error('[salvarTutorial]', err)
    return { error: 'Erro interno.' }
  }
}

export async function toggleTutorialAtivo(id: string, ativo: boolean) {
  try {
    const r = await exigirDono()
    if ('error' in r) return r
    const { supabase } = r
    const { error } = await supabase
      .from('tutoriais')
      .update({ ativo })
      .eq('id', id)
    if (error) return { error: 'Não foi possível atualizar.' }
    revalidatePath('/painel/configuracoes/tutoriais')
    revalidatePath('/painel/tutoriais')
    return { ok: true as const }
  } catch (err) {
    console.error('[toggleTutorialAtivo]', err)
    return { error: 'Erro interno.' }
  }
}
