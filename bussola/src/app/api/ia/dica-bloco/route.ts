import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemDica, BLOCOS_DICA, type BlocoDica } from '@/lib/iaPrompts'
import { donoEstab } from '../helpers'

const LABEL: Record<BlocoDica, string> = {
  elogios: 'elogios',
  equipe: 'equipe',
  desenvolvimento: 'desenvolvimento',
  observacoes: 'observações',
  metricas: 'métricas',
  metas_passadas: 'revisão de metas',
  metas_novas: 'novas metas',
}

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { bloco, contexto, regenerar } = await req.json().catch(() => ({}))
  if (!BLOCOS_DICA.includes(bloco)) return NextResponse.json({ error: 'Bloco inválido.' }, { status: 400 })

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  // Cache de 24h por bloco.
  if (!regenerar) {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: cache } = await supabase
      .from('sugestoes_ia')
      .select('conteudo')
      .eq('estabelecimento_id', est.id)
      .eq('tipo', 'dica_bloco')
      .eq('bloco', bloco)
      .gte('created_at', ontem)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (cache) return NextResponse.json({ dica: cache.conteudo, cached: true })
  }

  const ctx = typeof contexto === 'string' && contexto.trim() ? contexto.trim() : 'Sem dados específicos nesta semana.'
  const user = `${ctx}\n\nGere a dica para o bloco de ${LABEL[bloco as BlocoDica]}.`

  try {
    const res = await gerarTexto(systemDica(est.config.tom), user, 120)
    await supabase.from('sugestoes_ia').delete().eq('estabelecimento_id', est.id).eq('tipo', 'dica_bloco').eq('bloco', bloco)
    await supabase.from('sugestoes_ia').insert({
      tipo: 'dica_bloco',
      bloco,
      feedback_id: null,
      estabelecimento_id: est.id,
      conteudo: res.texto,
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })
    return NextResponse.json({ dica: res.texto, cached: false })
  } catch (err) {
    console.error('[dica-bloco]', err)
    return NextResponse.json({ error: 'Não foi possível gerar a dica.' }, { status: 502 })
  }
}
