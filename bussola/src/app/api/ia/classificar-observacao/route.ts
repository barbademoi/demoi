import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemClassificarObservacao, userClassificarObservacao } from '@/lib/iaPrompts'
import type { Momento } from '@/lib/iaPrompts'
import { donoEstab } from '../helpers'

const VALIDAS: Momento[] = ['reconhecimento', 'ajuste', 'equipe', 'neutro']

// Classifica uma OU várias observações em paralelo. Persiste momento_reuniao.
export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { ids } = await req.json().catch(() => ({}))
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids (array) obrigatório.' }, { status: 400 })
  }

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: fbs } = await supabase
    .from('feedbacks')
    .select('id, texto, momento_reuniao, estabelecimento_id')
    .in('id', ids)
    .is('deletado_em', null)

  const pendentes = (fbs ?? []).filter(
    (f) => (f as { estabelecimento_id: string }).estabelecimento_id === est.id && !(f as { momento_reuniao: string | null }).momento_reuniao
  ) as { id: string; texto: string }[]

  const resultados: Record<string, Momento> = {}

  await Promise.all(
    pendentes.map(async (f) => {
      try {
        const res = await gerarTexto(
          systemClassificarObservacao(),
          userClassificarObservacao(f.texto),
          12
        )
        const clean = res.texto.trim().toLowerCase().replace(/[".]/g, '') as Momento
        const momento: Momento = VALIDAS.includes(clean) ? clean : 'neutro'
        resultados[f.id] = momento
        await supabase.from('feedbacks').update({ momento_reuniao: momento }).eq('id', f.id)
        await supabase.from('sugestoes_ia').insert({
          tipo: 'classificar_observacao',
          feedback_id: f.id,
          estabelecimento_id: est.id,
          conteudo: momento,
          prompt_tokens: res.inputTokens,
          completion_tokens: res.outputTokens,
          modelo: res.modelo,
        })
      } catch (err) {
        console.error('[classificar-observacao] id=', f.id, err)
      }
    })
  )

  return NextResponse.json({ resultados, classificadas: Object.keys(resultados).length })
}
