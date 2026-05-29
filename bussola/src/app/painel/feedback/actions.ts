'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { CATEGORIAS as CATEGORIAS_PADRAO, type EscopoFeedback } from '@/lib/feedbacks'

interface EntradaFeedback {
  escopo: EscopoFeedback
  profissional_id: string | null
  texto: string
  categoria: string | null
}

async function getEstabId(): Promise<{ id: string; categorias: string[] } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id, categorias_customizadas')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (data) {
    const cats = Array.isArray(data.categorias_customizadas) && (data.categorias_customizadas as string[]).length > 0
      ? (data.categorias_customizadas as string[])
      : CATEGORIAS_PADRAO
    return { id: data.id as string, categorias: cats }
  }
  // Fallback se a migration ainda não rodou.
  const { data: base } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!base) return null
  return { id: base.id as string, categorias: CATEGORIAS_PADRAO }
}

function validar(input: EntradaFeedback): string | null {
  if (input.escopo !== 'individual' && input.escopo !== 'equipe') return 'Escopo inválido.'
  if (input.escopo === 'individual' && !input.profissional_id) return 'Escolha um colaborador.'
  const texto = (input.texto ?? '').trim()
  if (!texto) return 'Escreva a observação.'
  if (texto.length > 2000) return 'Texto muito longo (máx. 2000).'
  return null
}

export async function criarFeedback(input: EntradaFeedback) {
  const erro = validar(input)
  if (erro) return { error: erro }

  try {
    const supabase = createClient()
    const cfg = await getEstabId()
    if (!cfg) return { error: 'Sessão expirada. Faça login novamente.' }

    const profId = input.escopo === 'equipe' ? null : input.profissional_id
    const categoria = input.categoria && cfg.categorias.includes(input.categoria) ? input.categoria : null

    if (input.escopo === 'individual') {
      const { data: prof } = await supabase
        .from('profissionais')
        .select('id')
        .eq('id', profId)
        .eq('estabelecimento_id', cfg.id)
        .maybeSingle()
      if (!prof) return { error: 'Colaborador inválido.' }
    }

    const agora = new Date().toISOString()
    const { data: novo, error } = await supabase
      .from('feedbacks')
      .insert({
        escopo: input.escopo,
        profissional_id: profId,
        estabelecimento_id: cfg.id,
        texto: input.texto.trim(),
        categoria,
        status: 'pendente',
        visivel_profissional_em: input.escopo === 'individual' ? agora : null,
        momento_reuniao: null,
      })
      .select('id')
      .single()
    if (error || !novo) {
      console.error('[criarFeedback] erro supabase:', error)
      return { error: 'Não foi possível salvar. Tente novamente.' }
    }

    revalidatePath('/painel')
    if (profId) revalidatePath(`/painel/profissionais/${profId}`)
    revalidatePath('/painel/profissionais')
    revalidatePath('/painel/feedbacks-equipe')
    return { ok: true as const, id: novo.id as string }
  } catch (err) {
    console.error('[criarFeedback] erro inesperado:', err)
    return { error: 'Erro interno. Tente novamente.' }
  }
}

export async function atualizarFeedback(id: string, input: EntradaFeedback) {
  const erro = validar(input)
  if (erro) return { error: erro }

  try {
    const supabase = createClient()
    const profId = input.escopo === 'equipe' ? null : input.profissional_id
    const { error } = await supabase
      .from('feedbacks')
      .update({
        escopo: input.escopo,
        profissional_id: profId,
        texto: input.texto.trim(),
        categoria: input.categoria,
      })
      .eq('id', id)
    if (error) return { error: 'Não foi possível salvar.' }

    revalidatePath('/painel')
    revalidatePath('/painel/profissionais')
    revalidatePath('/painel/feedbacks-equipe')
    if (profId) revalidatePath(`/painel/profissionais/${profId}`)
    return { ok: true as const }
  } catch (err) {
    console.error('[atualizarFeedback] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}

export async function excluirFeedback(id: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('feedbacks')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: 'Não foi possível excluir.' }

    revalidatePath('/painel')
    revalidatePath('/painel/profissionais')
    return { ok: true as const }
  } catch (err) {
    console.error('[excluirFeedback] erro inesperado:', err)
    return { error: 'Erro interno.' }
  }
}
