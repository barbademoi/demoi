'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function getEstabId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  return (data?.id as string) ?? null
}

export async function marcarLido(id: string) {
  try {
    const supabase = createClient()
    const estabId = await getEstabId()
    if (!estabId) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('feedbacks_cliente')
      .update({ status: 'lido' })
      .eq('id', id)
      .eq('estabelecimento_id', estabId)
      .eq('status', 'novo')
    if (error) return { error: 'Não foi possível atualizar.' }
    revalidatePath('/painel/feedbacks-cliente')
    revalidatePath('/painel')
    return { ok: true as const }
  } catch (err) {
    console.error('[marcarLido]', err)
    return { error: 'Erro interno.' }
  }
}

export async function arquivar(id: string) {
  try {
    const supabase = createClient()
    const estabId = await getEstabId()
    if (!estabId) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('feedbacks_cliente')
      .update({ status: 'arquivado' })
      .eq('id', id)
      .eq('estabelecimento_id', estabId)
    if (error) return { error: 'Não foi possível arquivar.' }
    revalidatePath('/painel/feedbacks-cliente')
    return { ok: true as const }
  } catch (err) {
    console.error('[arquivar]', err)
    return { error: 'Erro interno.' }
  }
}

export async function toggleBrindeUsado(id: string, usado: boolean) {
  try {
    const supabase = createClient()
    const estabId = await getEstabId()
    if (!estabId) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('feedbacks_cliente')
      .update({
        brinde_usado: usado,
        brinde_usado_em: usado ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('estabelecimento_id', estabId)
    if (error) return { error: 'Não foi possível atualizar.' }
    revalidatePath('/painel/feedbacks-cliente')
    return { ok: true as const }
  } catch (err) {
    console.error('[toggleBrindeUsado]', err)
    return { error: 'Erro interno.' }
  }
}

// (a) Cria uma observação privada no link do colaborador citado, visível
// imediatamente. Marca o feedback de cliente como compartilhado.
export async function compartilharComColaborador(id: string) {
  try {
    const supabase = createClient()
    const estabId = await getEstabId()
    if (!estabId) return { error: 'Não autenticado.' }

    const { data: fb } = await supabase
      .from('feedbacks_cliente')
      .select('id, profissional_id, comentario, estrelas')
      .eq('id', id)
      .eq('estabelecimento_id', estabId)
      .maybeSingle()
    if (!fb) return { error: 'Feedback não encontrado.' }
    if (!fb.profissional_id) return { error: 'Sem colaborador citado.' }
    if (!fb.comentario) return { error: 'Sem comentário pra compartilhar.' }

    const texto = `Feedback de cliente (${fb.estrelas}★): ${fb.comentario}`
    const { data: obs, error: obsErr } = await supabase
      .from('feedbacks')
      .insert({
        estabelecimento_id: estabId,
        profissional_id: fb.profissional_id,
        escopo: 'individual',
        texto,
        categoria: 'Atendimento',
        status: 'pendente',
        visivel_profissional_em: new Date().toISOString(),
        momento_reuniao: null,
      })
      .select('id')
      .single()
    if (obsErr || !obs) return { error: 'Não foi possível criar a observação.' }

    await supabase
      .from('feedbacks_cliente')
      .update({ status: 'compartilhado_colaborador', feedback_gerado_id: obs.id })
      .eq('id', id)
      .eq('estabelecimento_id', estabId)

    revalidatePath('/painel/feedbacks-cliente')
    revalidatePath('/painel')
    return { ok: true as const, observacaoId: obs.id as string }
  } catch (err) {
    console.error('[compartilharComColaborador]', err)
    return { error: 'Erro interno.' }
  }
}

// (b) Cria uma observação interna manual. Não vincula o status do feedback de
// cliente — fica só como "lido" se ainda não estiver.
export async function criarObservacaoInterna(input: {
  feedbackClienteId: string
  texto: string
  profissionalId: string | null
  escopo: 'individual' | 'equipe'
}) {
  try {
    const supabase = createClient()
    const estabId = await getEstabId()
    if (!estabId) return { error: 'Não autenticado.' }

    const texto = (input.texto ?? '').trim()
    if (!texto) return { error: 'Texto vazio.' }
    if (input.escopo === 'individual' && !input.profissionalId) return { error: 'Escolha um colaborador.' }

    const profId = input.escopo === 'equipe' ? null : input.profissionalId
    const visivel = input.escopo === 'individual' ? new Date().toISOString() : null

    const { data: obs, error: obsErr } = await supabase
      .from('feedbacks')
      .insert({
        estabelecimento_id: estabId,
        profissional_id: profId,
        escopo: input.escopo,
        texto,
        categoria: 'Atendimento',
        status: 'pendente',
        visivel_profissional_em: visivel,
        momento_reuniao: null,
      })
      .select('id')
      .single()
    if (obsErr || !obs) return { error: 'Não foi possível criar a observação.' }

    await supabase
      .from('feedbacks_cliente')
      .update({ status: 'lido' })
      .eq('id', input.feedbackClienteId)
      .eq('estabelecimento_id', estabId)
      .eq('status', 'novo')

    revalidatePath('/painel/feedbacks-cliente')
    revalidatePath('/painel')
    return { ok: true as const, observacaoId: obs.id as string }
  } catch (err) {
    console.error('[criarObservacaoInterna]', err)
    return { error: 'Erro interno.' }
  }
}
