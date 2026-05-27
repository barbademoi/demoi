'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { proximaReuniao } from '@/lib/reuniao'
import { semanaRef } from '@/lib/periodos'
import type { PautaReuniao } from '@/lib/pauta'

async function getEstabelecimentoId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  return data?.id ?? null
}

export async function salvarPauta(reuniaoId: string, pauta: PautaReuniao) {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('reunioes').update({ pauta }).eq('id', reuniaoId)
    if (error) return { error: 'Não foi possível salvar.' }
    revalidatePath('/painel/reuniao')
    return { ok: true }
  } catch (err) {
    console.error('[salvarPauta]', err)
    return { error: 'Erro interno.' }
  }
}

export async function marcarParticular(reuniaoId: string, feedbackIds: string[]) {
  if (!feedbackIds.length) return { ok: true }
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('feedbacks')
      .update({ status: 'discutido_particular' })
      .in('id', feedbackIds)
    if (error) return { error: 'Não foi possível atualizar.' }
    revalidatePath('/painel/reuniao')
    return { ok: true }
  } catch (err) {
    console.error('[marcarParticular]', err)
    return { error: 'Erro interno.' }
  }
}

export async function marcarDiscutido(feedbackId: string, discutido: boolean) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('feedbacks')
      .update({ status: discutido ? 'discutido_reuniao' : 'pendente' })
      .eq('id', feedbackId)
    if (error) return { error: 'Não foi possível atualizar.' }
    return { ok: true }
  } catch (err) {
    console.error('[marcarDiscutido]', err)
    return { error: 'Erro interno.' }
  }
}

export async function finalizarReuniao(reuniaoId: string, pauta: PautaReuniao) {
  try {
    const supabase = createClient()
    const estabelecimentoId = await getEstabelecimentoId()
    if (!estabelecimentoId) return { error: 'Sessão expirada.' }

    const { data: reuniaoData } = await supabase
      .from('reunioes')
      .select('pauta')
      .eq('id', reuniaoId)
      .maybeSingle()
    const iniciadaEm = (reuniaoData?.pauta as PautaReuniao | null)?.iniciada_em ?? pauta.iniciada_em
    const duracao = iniciadaEm
      ? Math.max(1, Math.round((Date.now() - new Date(iniciadaEm).getTime()) / 60000))
      : null

    // Status dos feedbacks conforme decisão.
    const decisoes = pauta.decisoes ?? {}
    const incluidos = Object.keys(decisoes).filter((id) => decisoes[id] === 'incluir')
    const particulares = Object.keys(decisoes).filter((id) => decisoes[id] === 'particular')
    if (incluidos.length) {
      await supabase.from('feedbacks').update({ status: 'discutido_reuniao' }).in('id', incluidos)
    }
    if (particulares.length) {
      await supabase.from('feedbacks').update({ status: 'discutido_particular' }).in('id', particulares)
    }

    // Novas metas → metas_semanais.
    const novas = (pauta.novasMetas ?? []).filter((m) => m.texto.trim())
    if (novas.length) {
      await supabase.from('metas_semanais').insert(
        novas.map((m) => ({
          estabelecimento_id: estabelecimentoId,
          reuniao_id: reuniaoId,
          texto: m.texto.trim(),
          responsavel_id: m.responsavel_id,
          semana_referencia: semanaRef('atual'),
          status: 'ativa',
        }))
      )
    }

    const { error } = await supabase
      .from('reunioes')
      .update({
        status: 'concluida',
        duracao_minutos: duracao,
        anotacoes: pauta.anotacaoGeral ?? null,
        pauta,
        metas: novas,
      })
      .eq('id', reuniaoId)
    if (error) return { error: 'Não foi possível finalizar.' }

    // Garante a próxima reunião planejada.
    const { data: est } = await supabase
      .from('estabelecimentos')
      .select('dia_reuniao, hora_reuniao')
      .eq('id', estabelecimentoId)
      .maybeSingle()
    const prox = proximaReuniao(est?.dia_reuniao ?? 1, est?.hora_reuniao ?? '09:00')
    const { data: jaTem } = await supabase
      .from('reunioes')
      .select('id')
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('status', 'planejada')
      .gt('data_reuniao', new Date().toISOString())
      .maybeSingle()
    if (!jaTem) {
      await supabase.from('reunioes').insert({
        estabelecimento_id: estabelecimentoId,
        data_reuniao: prox.data.toISOString(),
        status: 'planejada',
      })
    }

    revalidatePath('/painel')
    revalidatePath('/painel/reuniao')
    revalidatePath('/painel/historico-reunioes')
    return { ok: true }
  } catch (err) {
    console.error('[finalizarReuniao]', err)
    return { error: 'Erro interno.' }
  }
}
