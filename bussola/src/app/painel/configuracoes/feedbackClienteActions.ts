'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { gerarSlug, MENSAGEM_POS_FEEDBACK_PADRAO } from '@/lib/feedbackCliente'

async function getEstabelecimentoId(): Promise<string | null> {
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

export async function ativarFeedbackCliente() {
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }

    const { data: atual } = await supabase
      .from('estabelecimentos')
      .select('link_feedback_cliente_slug, mensagem_pos_feedback')
      .eq('id', id)
      .maybeSingle()

    const slug = atual?.link_feedback_cliente_slug ?? (await gerarSlugUnico(supabase))
    const mensagem = atual?.mensagem_pos_feedback ?? MENSAGEM_POS_FEEDBACK_PADRAO

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        feedback_cliente_ativo: true,
        link_feedback_cliente_slug: slug,
        mensagem_pos_feedback: mensagem,
      })
      .eq('id', id)
    if (error) return { error: 'Não foi possível ativar.' }

    revalidatePath('/painel/configuracoes')
    revalidatePath('/painel')
    return { ok: true as const, slug, mensagem }
  } catch (err) {
    console.error('[ativarFeedbackCliente]', err)
    return { error: 'Erro interno.' }
  }
}

async function gerarSlugUnico(supabase: ReturnType<typeof createClient>): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const s = gerarSlug(12)
    const { data } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('link_feedback_cliente_slug', s)
      .maybeSingle()
    if (!data) return s
  }
  // Fallback praticamente impossível de colidir após 8 tentativas.
  return gerarSlug(16)
}

export async function desativarFeedbackCliente() {
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ feedback_cliente_ativo: false })
      .eq('id', id)
    if (error) return { error: 'Não foi possível desativar.' }
    revalidatePath('/painel/configuracoes')
    revalidatePath('/painel')
    return { ok: true as const }
  } catch (err) {
    console.error('[desativarFeedbackCliente]', err)
    return { error: 'Erro interno.' }
  }
}

export async function salvarMensagemPosFeedback(texto: string) {
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }
    const limpo = (texto ?? '').trim().slice(0, 200)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ mensagem_pos_feedback: limpo || MENSAGEM_POS_FEEDBACK_PADRAO })
      .eq('id', id)
    if (error) return { error: 'Não foi possível salvar.' }
    revalidatePath('/painel/configuracoes')
    return { ok: true as const }
  } catch (err) {
    console.error('[salvarMensagemPosFeedback]', err)
    return { error: 'Erro interno.' }
  }
}

interface BrindeInput {
  nome: string
  descricao: string | null
  peso: number
  ativo: boolean
}

function validarBrinde(b: BrindeInput): string | null {
  const nome = (b.nome ?? '').trim()
  if (!nome) return 'Nome obrigatório.'
  if (nome.length > 80) return 'Nome muito longo.'
  if (!Number.isFinite(b.peso) || b.peso < 1 || b.peso > 100) return 'Peso deve ser entre 1 e 100.'
  return null
}

export async function criarBrinde(input: BrindeInput) {
  const erro = validarBrinde(input)
  if (erro) return { error: erro }
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }
    const { data, error } = await supabase
      .from('brindes')
      .insert({
        estabelecimento_id: id,
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || null,
        peso: Math.round(input.peso),
        ativo: !!input.ativo,
      })
      .select('id')
      .single()
    if (error || !data) return { error: 'Não foi possível salvar.' }
    revalidatePath('/painel/configuracoes')
    return { ok: true as const, id: data.id as string }
  } catch (err) {
    console.error('[criarBrinde]', err)
    return { error: 'Erro interno.' }
  }
}

export async function atualizarBrinde(brindeId: string, input: BrindeInput) {
  const erro = validarBrinde(input)
  if (erro) return { error: erro }
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('brindes')
      .update({
        nome: input.nome.trim(),
        descricao: input.descricao?.trim() || null,
        peso: Math.round(input.peso),
        ativo: !!input.ativo,
      })
      .eq('id', brindeId)
      .eq('estabelecimento_id', id)
    if (error) return { error: 'Não foi possível salvar.' }
    revalidatePath('/painel/configuracoes')
    return { ok: true as const }
  } catch (err) {
    console.error('[atualizarBrinde]', err)
    return { error: 'Erro interno.' }
  }
}

export async function excluirBrinde(brindeId: string) {
  try {
    const supabase = createClient()
    const id = await getEstabelecimentoId()
    if (!id) return { error: 'Não autenticado.' }
    const { error } = await supabase
      .from('brindes')
      .delete()
      .eq('id', brindeId)
      .eq('estabelecimento_id', id)
    if (error) return { error: 'Não foi possível excluir.' }
    revalidatePath('/painel/configuracoes')
    return { ok: true as const }
  } catch (err) {
    console.error('[excluirBrinde]', err)
    return { error: 'Erro interno.' }
  }
}
