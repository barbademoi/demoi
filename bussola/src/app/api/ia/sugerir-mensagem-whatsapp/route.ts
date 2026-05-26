import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemWhats, userWhats } from '@/lib/iaPrompts'
import type { Feedback } from '@/lib/feedbacks'
import type { Profissional } from '@/lib/profissionais'
import { donoEstab } from '../helpers'

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { feedbackId } = await req.json().catch(() => ({}))
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
  if (fb.tipo !== 'positivo' || !fb.profissionais) {
    return NextResponse.json({ error: 'Disponível só para elogio individual.' }, { status: 400 })
  }

  try {
    const primeiro = fb.profissionais.nome.split(' ')[0]
    const res = await gerarTexto(systemWhats(est.config.tom), userWhats(primeiro, fb.texto, fb.categoria), 200)
    await supabase.from('sugestoes_ia').insert({
      tipo: 'mensagem_whatsapp',
      feedback_id: feedbackId,
      estabelecimento_id: est.id,
      conteudo: res.texto,
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })
    return NextResponse.json({ mensagem: res.texto })
  } catch (err) {
    console.error('[sugerir-mensagem-whatsapp]', err)
    return NextResponse.json({ error: 'Não foi possível gerar a mensagem.' }, { status: 502 })
  }
}
