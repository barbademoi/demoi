import { NextRequest, NextResponse } from 'next/server'
import { gerarMensagemReativacao, temChaveIA } from '@/lib/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!temChaveIA()) {
    return NextResponse.json(
      { erro: 'IA indisponível: falta configurar ANTHROPIC_API_KEY no ambiente (.env.local).' },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  const nome = body?.nome as string | undefined
  const diasSemCortar = Number(body?.diasSemCortar ?? 0)
  const instrucaoBase = (body?.instrucaoBase as string | undefined)?.trim()
  const mensagensAnteriores = Array.isArray(body?.mensagensAnteriores) ? (body.mensagensAnteriores as string[]) : []

  if (!nome || !instrucaoBase) {
    return NextResponse.json({ erro: 'nome e instrucaoBase são obrigatórios.' }, { status: 400 })
  }

  try {
    const mensagem = await gerarMensagemReativacao({ nome, diasSemCortar, instrucaoBase, mensagensAnteriores })
    return NextResponse.json({ mensagem })
  } catch (err) {
    const mensagemErro = err instanceof Error ? err.message : 'Erro ao gerar mensagem com a IA.'
    return NextResponse.json({ erro: mensagemErro }, { status: 500 })
  }
}
