import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { temChaveIA, gerarTexto } from '@/utils/anthropic'

export const dynamic = 'force-dynamic'

const SYSTEM = `Você cria tutoriais práticos para um sistema chamado Bússola, que ajuda gestores de empresas a conduzir reuniões semanais com a equipe.

A Bússola tem essas características que você precisa conhecer:
- O gestor registra "observações" sobre seus colaboradores durante a semana (campo de texto simples, sem classificar positivo/negativo)
- Categoria da observação é opcional
- Cada colaborador tem um link único onde recebe as observações (sem precisar de login)
- Toda semana acontece uma "reunião" estruturada em 6 momentos: Abertura, Revisão, Reconhecimento, Equipe, Ajustes, Encerramento
- A IA classifica observações nos momentos certos
- IA dá dicas estratégicas em cada momento da reunião
- Tem feature de coleta de feedback do cliente final com sorteio de brindes

REGRAS DA SUA RESPOSTA:
- Gere de 3 a 8 passos, conforme a complexidade
- Cada passo tem: numero, titulo (curto), conteudo (1 parágrafo claro), dica (opcional)
- Conteúdo conceitual, NÃO mencione botões específicos por nome ("clique em X")
- Em vez disso, fale de ações ("abra a tela de registro", "vá em configurações")
- Tom: sereno, brasileiro, direto
- Sem emojis no conteúdo
- Sem citar livros, autores, ou ferramentas externas
- Cada passo: máximo 80 palavras
- Dicas (quando houver): máximo 30 palavras

Responda em JSON estrito com este formato:
{
  "passos": [
    { "numero": 1, "titulo": "...", "conteudo": "...", "dica": "..." }
  ]
}`

function categoriaLabel(k: string): string {
  switch (k) {
    case 'primeiros_passos': return 'Primeiros passos'
    case 'reuniao': return 'Sua reunião semanal'
    case 'feedback': return 'Feedback e comunicação'
    case 'cliente': return 'Feedback de clientes'
    case 'configuracoes': return 'Configurações'
    default: return k
  }
}

interface PassoGerado {
  numero: number
  titulo?: string | null
  conteudo: string
  dica?: string | null
}

function extrairJSON(texto: string): { passos: PassoGerado[] } | null {
  const limpo = texto.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim()
  try {
    const obj = JSON.parse(limpo) as { passos?: PassoGerado[] }
    if (!Array.isArray(obj.passos)) return null
    return { passos: obj.passos }
  } catch {
    const m = limpo.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      const obj = JSON.parse(m[0]) as { passos?: PassoGerado[] }
      if (!Array.isArray(obj.passos)) return null
      return { passos: obj.passos }
    } catch {
      return null
    }
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (!est) return NextResponse.json({ error: 'Sem empresa.' }, { status: 403 })

  if (!temChaveIA()) {
    return NextResponse.json({ error: 'IA não configurada no servidor.' }, { status: 503 })
  }

  const { data: tut } = await supabase
    .from('tutoriais')
    .select('id, categoria, titulo')
    .eq('id', params.id)
    .maybeSingle()
  if (!tut) return NextResponse.json({ error: 'Tutorial não encontrado.' }, { status: 404 })

  const userPrompt = `Categoria: ${categoriaLabel(tut.categoria as string)}
Tutorial: ${tut.titulo as string}

Gere os passos.`

  let resultado
  try {
    resultado = await gerarTexto(SYSTEM, userPrompt, 1500)
  } catch (err) {
    console.error('[regenerar tutorial] gerarTexto', err)
    return NextResponse.json({ error: 'Falha ao gerar conteúdo.' }, { status: 502 })
  }

  const parsed = extrairJSON(resultado.texto)
  if (!parsed || parsed.passos.length === 0) {
    return NextResponse.json({ error: 'Resposta da IA inválida.' }, { status: 502 })
  }

  const passosLimpos = parsed.passos
    .map((p, i) => ({
      tutorial_id: params.id,
      numero: i + 1,
      titulo: typeof p.titulo === 'string' && p.titulo.trim() ? p.titulo.trim() : null,
      conteudo: typeof p.conteudo === 'string' ? p.conteudo.trim() : '',
      dica: typeof p.dica === 'string' && p.dica.trim() ? p.dica.trim() : null,
    }))
    .filter((p) => p.conteudo.length > 0)

  if (passosLimpos.length === 0) {
    return NextResponse.json({ error: 'IA não devolveu passos válidos.' }, { status: 502 })
  }

  const { error: delErr } = await supabase
    .from('tutorial_passos')
    .delete()
    .eq('tutorial_id', params.id)
  if (delErr) {
    console.error('[regenerar tutorial] delete', delErr)
    return NextResponse.json({ error: 'Falha ao limpar passos antigos.' }, { status: 500 })
  }

  const { error: insErr } = await supabase
    .from('tutorial_passos')
    .insert(passosLimpos)
  if (insErr) {
    console.error('[regenerar tutorial] insert', insErr)
    return NextResponse.json({ error: 'Falha ao salvar novos passos.' }, { status: 500 })
  }

  const novos = passosLimpos.map((p) => ({
    id: '',
    numero: p.numero,
    titulo: p.titulo,
    conteudo: p.conteudo,
    dica: p.dica,
  }))

  return NextResponse.json({
    ok: true,
    passos: novos,
    tokens: { in: resultado.inputTokens, out: resultado.outputTokens },
  })
}
