'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarSlug } from '@/lib/utils'

async function autorizarDono() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' as const }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios').select('barbearia_id').eq('id', user.id).single() as
    { data: { barbearia_id: string } | null }
  if (!usuario) return { error: 'Barbearia não encontrada.' as const }
  return { supabase, barbeariaId: usuario.barbearia_id }
}

/**
 * Gera slug único a partir do nome da barbearia. Append '-2', '-3', etc.
 * em colisão. Usa admin client pra checar todas as barbearias (sem RLS).
 */
async function gerarSlugUnico(nome: string): Promise<string> {
  const admin = createAdminClient()
  const base = normalizarSlug(nome)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existentes } = await (admin as any)
    .from('barbearias').select('feedback_slug')
    .like('feedback_slug', `${base}%`)
  const taken = new Set(((existentes ?? []) as { feedback_slug: string | null }[])
    .map(r => r.feedback_slug).filter(Boolean) as string[])
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const tentativa = `${base}-${i}`
    if (!taken.has(tentativa)) return tentativa
  }
  return `${base}-${Date.now()}`
}

/** Liga o feedback (gera slug na 1a vez) ou desliga. */
export async function alternarFeedbackAtivo(ativar: boolean) {
  const auth = await autorizarDono()
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId } = auth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barb } = await (supabase as any)
    .from('barbearias').select('nome, feedback_slug').eq('id', barbeariaId).single() as
    { data: { nome: string; feedback_slug: string | null } | null }

  const payload: Record<string, unknown> = { feedback_ativo: ativar }
  if (ativar && !barb?.feedback_slug) {
    payload.feedback_slug = await gerarSlugUnico(barb?.nome ?? 'barbearia')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update(payload).eq('id', barbeariaId)
  if (error) return { error: 'Erro ao salvar.' }
  revalidatePath('/dashboard/feedback-cliente')
  return { ok: true as const }
}

interface FeedbackConfigInput {
  mensagemPos: string | null
  brindeMinimoId: string | null
  googleReviewUrl: string | null
  notaMinimaPositivo: number
  gamificacaoAtiva: boolean
  pontosPorFeedback: number
  limiteDiarioPontuavel: number
  brindeValidadeDias: number
}

const VALIDADES_ACEITAS = [15, 30, 60, 90] as const

export async function salvarFeedbackConfig(c: FeedbackConfigInput) {
  const auth = await autorizarDono()
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId } = auth

  // Validações leves
  const nota = Math.max(1, Math.min(5, Math.round(c.notaMinimaPositivo || 4)))
  const pontos = Math.max(0, Math.round(c.pontosPorFeedback || 0))
  const limite = Math.max(0, Math.round(c.limiteDiarioPontuavel || 0))
  const msg = c.mensagemPos ? c.mensagemPos.trim().slice(0, 200) || null : null
  const url = c.googleReviewUrl ? c.googleReviewUrl.trim() || null : null
  const validade = VALIDADES_ACEITAS.includes(c.brindeValidadeDias as (typeof VALIDADES_ACEITAS)[number])
    ? c.brindeValidadeDias
    : 30

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('barbearias').update({
      feedback_mensagem_pos: msg,
      feedback_brinde_minimo_id: c.brindeMinimoId || null,
      feedback_google_review_url: url,
      feedback_nota_minima_positivo: nota,
      feedback_gamificacao_ativa: c.gamificacaoAtiva,
      feedback_pontos_por_feedback: pontos,
      feedback_limite_diario_pontuavel: limite,
      brinde_validade_dias: validade,
    }).eq('id', barbeariaId)
  if (error) return { error: (error as { message: string }).message }

  // Quando o dono DESATIVA a gamificação, apaga retroativamente os pontos
  // concedidos por feedbacks dessa barbearia (controle_diario do servico
  // de feedback). Decisão de produto: "desliga = volta a zero", sem
  // resíduo. Pra religar, o histórico futuro recomeça.
  if (!c.gamificacaoAtiva) {
    await apagarPontosDeFeedbackRetroativos(barbeariaId)
  }

  revalidatePath('/dashboard/feedback-cliente')
  revalidatePath('/dashboard')
  return { ok: true as const }
}

/**
 * Apaga TODOS os lançamentos em controle_diario que têm servico_id de
 * um serviço com eh_servico_feedback=true (de qualquer campanha da
 * barbearia). Zera também `pontos_concedidos` nos feedbacks já gravados
 * pra coerência com a UI do painel. Não toca nas linhas de feedback em si.
 */
async function apagarPontosDeFeedbackRetroativos(barbeariaId: string) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: camps } = await (admin as any)
    .from('campanha').select('id').eq('barbearia_id', barbeariaId)
  const campIds = ((camps ?? []) as { id: string }[]).map(c => c.id)
  if (campIds.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: servs } = await (admin as any)
    .from('campanha_servicos').select('id')
    .in('campanha_id', campIds).eq('eh_servico_feedback', true)
  const servIds = ((servs ?? []) as { id: string }[]).map(s => s.id)
  if (servIds.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('controle_diario').delete().in('servico_id', servIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('feedbacks_cliente')
    .update({ pontos_concedidos: 0 }).eq('barbearia_id', barbeariaId)
}

// ── Brindes ────────────────────────────────────────────────────────────────

interface BrindeInput {
  id?: string
  nome: string
  descricao: string | null
  fotoUrl: string | null
  peso: number
  ativo: boolean
}

export async function salvarBrinde(input: BrindeInput) {
  const auth = await autorizarDono()
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId } = auth
  const nome = input.nome.trim()
  if (!nome) return { error: 'Nome do brinde é obrigatório.' }
  const peso = Math.max(1, Math.round(input.peso || 1))

  if (input.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('brindes')
      .update({ nome, descricao: input.descricao, foto_url: input.fotoUrl, peso, ativo: input.ativo })
      .eq('id', input.id).eq('barbearia_id', barbeariaId)
    if (error) return { error: (error as { message: string }).message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('brindes')
      .insert({ barbearia_id: barbeariaId, nome, descricao: input.descricao, foto_url: input.fotoUrl, peso, ativo: input.ativo })
    if (error) return { error: (error as { message: string }).message }
  }
  revalidatePath('/dashboard/feedback-cliente')
  return { ok: true as const }
}

export async function excluirBrinde(id: string) {
  const auth = await autorizarDono()
  if ('error' in auth) return { error: auth.error }
  const { supabase, barbeariaId } = auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('brindes').delete().eq('id', id).eq('barbearia_id', barbeariaId)
  revalidatePath('/dashboard/feedback-cliente')
  return { ok: true as const }
}
