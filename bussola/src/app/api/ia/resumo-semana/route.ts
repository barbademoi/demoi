import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemResumo } from '@/lib/iaPrompts'
import { intervalo } from '@/lib/periodos'
import type { TipoFeedback } from '@/lib/feedbacks'
import { donoEstab } from '../helpers'

interface FbResumo {
  profissional_id: string | null
  escopo: 'individual' | 'equipe'
  tipo: TipoFeedback
  estrelas: number | null
  categoria: string | null
  texto: string
  profissionais: { nome: string } | null
}

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { regenerar } = await req.json().catch(() => ({}))

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  // Cache de 1 hora.
  if (!regenerar) {
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: cache } = await supabase
      .from('sugestoes_ia')
      .select('conteudo')
      .eq('estabelecimento_id', est.id)
      .eq('tipo', 'resumo_semana')
      .gte('created_at', umaHoraAtras)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (cache) return NextResponse.json({ resumo: cache.conteudo, cached: true })
  }

  const semana = intervalo('semana')
  const { data } = await supabase
    .from('feedbacks')
    .select('profissional_id, escopo, categoria, texto, profissionais(nome)')
    .eq('estabelecimento_id', est.id)
    .is('deletado_em', null)
    .gte('created_at', semana.inicio.toISOString())
    .lte('created_at', semana.fim.toISOString())
  const fbs = (data ?? []) as unknown as FbResumo[]

  if (fbs.length === 0) {
    return NextResponse.json({ resumo: 'Nenhum feedback registrado nesta semana ainda.', cached: false })
  }

  const ind = fbs.filter((f) => f.escopo === 'individual')
  const eq = fbs.filter((f) => f.escopo === 'equipe')
  const pos = fbs.filter((f) => f.tipo === 'positivo').length
  const neg = fbs.filter((f) => f.tipo === 'negativo').length
  const obs = fbs.filter((f) => f.tipo === 'observacao').length

  // Top 3 mais elogiados.
  const elogiosPorProf: Record<string, number> = {}
  for (const f of ind) {
    if (f.tipo === 'positivo' && f.profissionais) {
      elogiosPorProf[f.profissionais.nome] = (elogiosPorProf[f.profissionais.nome] ?? 0) + 1
    }
  }
  const top3 = Object.entries(elogiosPorProf).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // Alertas: graves (negativo, 4-5 estrelas).
  const gravesPorProf: Record<string, number> = {}
  for (const f of ind) {
    if (f.tipo === 'negativo' && (f.estrelas ?? 0) >= 4 && f.profissionais) {
      gravesPorProf[f.profissionais.nome] = (gravesPorProf[f.profissionais.nome] ?? 0) + 1
    }
  }
  const alertas = Object.entries(gravesPorProf).filter(([, n]) => n >= 2)

  // Categorias mais frequentes.
  const catFreq: Record<string, number> = {}
  for (const f of fbs) {
    if (f.categoria) catFreq[f.categoria] = (catFreq[f.categoria] ?? 0) + 1
  }
  const cats = Object.entries(catFreq).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const dados = [
    `Feedbacks individuais: ${ind.length}. Feedbacks de equipe: ${eq.length}.`,
    `Distribuição: ${pos} positivos, ${neg} negativos, ${obs} observações.`,
    `Mais elogiados: ${top3.length ? top3.map(([n, c]) => `${n} (${c})`).join(', ') : 'ninguém ainda'}.`,
    alertas.length ? `ALERTAS: ${alertas.map(([n, c]) => `${n} com ${c} feedbacks graves`).join('; ')}.` : 'Sem alertas graves.',
    eq.length ? `Sobre a equipe: ${eq.map((f) => `(${f.tipo}) ${f.texto}`).join(' | ')}` : '',
    cats.length ? `Categorias mais frequentes: ${cats.map(([c, n]) => `${c} (${n})`).join(', ')}.` : '',
    '',
    'Gere o resumo da semana.',
  ].filter(Boolean).join('\n')

  try {
    const res = await gerarTexto(systemResumo(est.config.tom), dados, 200)
    // Limpeza defensiva: remove markdown e um eventual título "Resumo da semana".
    const resumo = res.texto
      .replace(/\*+/g, '')
      .replace(/^\s*resumo da semana[:\s-]*/i, '')
      .trim()
    await supabase.from('sugestoes_ia').insert({
      tipo: 'resumo_semana',
      feedback_id: null,
      estabelecimento_id: est.id,
      conteudo: resumo,
      prompt_tokens: res.inputTokens,
      completion_tokens: res.outputTokens,
      modelo: res.modelo,
    })
    return NextResponse.json({ resumo, cached: false })
  } catch (err) {
    console.error('[resumo-semana]', err)
    return NextResponse.json({ error: 'Não foi possível gerar o resumo.' }, { status: 502 })
  }
}
