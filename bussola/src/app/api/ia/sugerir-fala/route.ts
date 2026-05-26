import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemFala, userFala } from '@/lib/iaPrompts'
import type { Feedback } from '@/lib/feedbacks'
import type { Profissional } from '@/lib/profissionais'
import { donoEstab } from '../helpers'

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { feedbackId, regenerar } = await req.json().catch(() => ({}))
  if (!feedbackId) return NextResponse.json({ error: 'feedbackId obrigatório.' }, { status: 400 })

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: fbRaw } = await supabase
    .from('feedbacks')
    .select('*, profissionais(*)')
    .eq('id', feedbackId)
    .is('deletado_em', null)
    .maybeSingle()
  if (!fbRaw) return NextResponse.json({ error: 'Feedback não encontrado.' }, { status: 404 })

  const fb = fbRaw as Feedback & { profissionais: Profissional | null }
  if (fb.estabelecimento_id !== est.id) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })
  if (!fb.profissionais) return NextResponse.json({ error: 'Disponível só para feedback individual.' }, { status: 400 })

  if (!regenerar) {
    const { data: cache } = await supabase
      .from('sugestoes_ia')
      .select('conteudo')
      .eq('feedback_id', feedbackId)
      .eq('tipo', 'fala_reuniao')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (cache) return NextResponse.json({ sugestao: cache.conteudo, cached: true })
  }

  try {
    const res = await gerarTexto(systemFala(est.config.tom), userFala(fb.profissionais, fb), 120)
    if (regenerar) {
      await supabase.from('sugestoes_ia').delete().eq('feedback_id', feedbackId).eq('tipo', 'fala_reuniao')
    }
    await supabase.from('sugestoes_ia').insert({
      tipo: 'fala_reuniao',
      feedback_id: feedbackId,
      estabelecimento_id: est.id,
      conteudo: res.texto,
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })
    await supabase.from('feedbacks').update({ sugestao_ia: res.texto }).eq('id', feedbackId)
    return NextResponse.json({ sugestao: res.texto, cached: false })
  } catch (err) {
    console.error('[sugerir-fala]', err)
    return NextResponse.json({ error: 'Não foi possível gerar a sugestão.' }, { status: 502 })
  }
}
