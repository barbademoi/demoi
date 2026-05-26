import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemCategoria, userCategoria } from '@/lib/iaPrompts'
import { CATEGORIAS, TIPOS, type TipoFeedback } from '@/lib/feedbacks'
import { donoEstab } from '../helpers'

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { texto, tipo } = await req.json().catch(() => ({}))
  if (!texto || typeof texto !== 'string' || !(tipo in TIPOS)) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const res = await gerarTexto(systemCategoria(), userCategoria(tipo as TipoFeedback, texto), 12)
    const limpo = res.texto.replace(/[".]/g, '').trim().toLowerCase()
    const categoria = CATEGORIAS.find((c) => c.toLowerCase() === limpo) ?? null

    await supabase.from('sugestoes_ia').insert({
      tipo: 'categoria_feedback',
      feedback_id: null,
      estabelecimento_id: est.id,
      conteudo: categoria ?? 'Outro',
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })

    return NextResponse.json({ categoria })
  } catch (err) {
    console.error('[sugerir-categoria]', err)
    return NextResponse.json({ error: 'Falha ao categorizar.' }, { status: 502 })
  }
}
