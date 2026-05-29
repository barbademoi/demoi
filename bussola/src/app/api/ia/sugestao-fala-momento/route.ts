import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemFalaMomento, userFalaMomento, type Momento } from '@/lib/iaPrompts'
import { donoEstab } from '../helpers'

const VALIDOS: Momento[] = ['reconhecimento', 'ajuste', 'equipe', 'neutro']

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { momento, contexto, regenerar } = await req.json().catch(() => ({}))
  if (!VALIDOS.includes(momento)) return NextResponse.json({ error: 'momento inválido.' }, { status: 400 })

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const chave = `fala_momento_${momento}`

  if (!regenerar) {
    const { data: cache } = await supabase
      .from('sugestoes_ia')
      .select('conteudo, created_at')
      .eq('estabelecimento_id', est.id)
      .eq('tipo', chave)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    // Reaproveita a sugestão da última hora.
    if (cache && Date.now() - Date.parse(cache.created_at) < 60 * 60 * 1000) {
      return NextResponse.json({ sugestao: cache.conteudo, cached: true })
    }
  }

  try {
    const res = await gerarTexto(
      systemFalaMomento(est.config.tom),
      userFalaMomento(momento, typeof contexto === 'string' ? contexto : ''),
      80
    )
    await supabase.from('sugestoes_ia').insert({
      tipo: chave,
      feedback_id: null,
      estabelecimento_id: est.id,
      conteudo: res.texto,
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })
    return NextResponse.json({ sugestao: res.texto, cached: false })
  } catch (err) {
    console.error('[sugestao-fala-momento]', err)
    return NextResponse.json({ error: 'Não foi possível gerar a sugestão.' }, { status: 502 })
  }
}
