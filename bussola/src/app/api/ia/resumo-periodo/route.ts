import { NextResponse } from 'next/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'
import { systemResumo } from '@/lib/iaPrompts'
import { ultimaReuniaoConcluidaIso } from '@/lib/loadCadencia'
import { donoEstab } from '../helpers'

interface FbResumo {
  profissional_id: string | null
  escopo: 'individual' | 'equipe'
  categoria: string | null
  texto: string
  profissionais: { nome: string } | null
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export async function POST(req: Request) {
  if (!temChaveIA()) return NextResponse.json({ error: 'IA não configurada.' }, { status: 503 })

  const { regenerar } = await req.json().catch(() => ({}))

  const { supabase, est } = await donoEstab()
  if (!est) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  // Cache de 1 hora (mesma chave do antigo).
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

  // Observações PENDENTES (pauta a discutir), sem filtro de data.
  const { data } = await supabase
    .from('feedbacks')
    .select('profissional_id, escopo, categoria, texto, profissionais(nome)')
    .eq('estabelecimento_id', est.id)
    .eq('status', 'pendente')
    .is('deletado_em', null)
  const fbs = (data ?? []) as unknown as FbResumo[]

  // Contexto temporal pro prompt: desde a última reunião ou desde o início.
  const ultIso = await ultimaReuniaoConcluidaIso(supabase, est.id)
  let contextoPeriodo: string
  let contextoLabel: string
  if (ultIso) {
    const d = new Date(ultIso)
    contextoPeriodo = `Desde a última reunião em ${d.getDate()} de ${MESES[d.getMonth()]}`
    contextoLabel = 'desde a última reunião'
  } else {
    contextoPeriodo = 'Desde o início do uso da Bússola — esta é a primeira reunião'
    contextoLabel = 'desde que você começou'
  }

  if (fbs.length === 0) {
    return NextResponse.json({
      resumo: ultIso
        ? 'Nenhuma observação pendente desde a última reunião.'
        : 'Nenhuma observação registrada ainda. Quando você começar a registrar, o resumo aparece aqui.',
      cached: false,
    })
  }

  const ind = fbs.filter((f) => f.escopo === 'individual')
  const eq = fbs.filter((f) => f.escopo === 'equipe')

  const porProf: Record<string, number> = {}
  for (const f of ind) {
    if (f.profissionais) porProf[f.profissionais.nome] = (porProf[f.profissionais.nome] ?? 0) + 1
  }
  const top = Object.entries(porProf).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const catFreq: Record<string, number> = {}
  for (const f of fbs) {
    if (f.categoria) catFreq[f.categoria] = (catFreq[f.categoria] ?? 0) + 1
  }
  const cats = Object.entries(catFreq).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const linhas: string[] = []
  linhas.push(`Período: ${contextoPeriodo}.`)
  linhas.push(`Total de observações ${contextoLabel}: ${fbs.length} (${ind.length} individuais, ${eq.length} sobre a equipe).`)
  if (top.length) linhas.push(`Volume por colaborador: ${top.map(([n, c]) => `${n} (${c})`).join(', ')}.`)
  if (cats.length) linhas.push(`Categorias mais frequentes: ${cats.map(([c, n]) => `${c} (${n})`).join(', ')}.`)
  linhas.push('')
  linhas.push('Observações individuais (até 30):')
  for (const f of ind.slice(0, 30)) {
    linhas.push(`- ${f.profissionais?.nome ?? '—'}${f.categoria ? ` [${f.categoria}]` : ''}: ${f.texto}`)
  }
  if (eq.length) {
    linhas.push('')
    linhas.push('Observações sobre a equipe:')
    for (const f of eq.slice(0, 15)) linhas.push(`- ${f.texto}`)
  }
  linhas.push('')
  if (!ultIso) {
    linhas.push('Como esta é a primeira reunião, abra o resumo mencionando isso de forma natural.')
  }
  linhas.push('Gere o resumo do período.')

  try {
    const res = await gerarTexto(systemResumo(est.config.tom), linhas.join('\n'), 220)
    const resumo = res.texto
      .replace(/\*+/g, '')
      .replace(/^\s*resumo[:\s-]*/i, '')
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
    console.error('[resumo-periodo]', err)
    return NextResponse.json({ error: 'Não foi possível gerar o resumo.' }, { status: 502 })
  }
}
