import { NextRequest, NextResponse } from 'next/server'
import { lerPlanilha } from '@/lib/parse'
import { mesclarClientes } from '@/lib/clientes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const arquivo = formData.get('arquivo')

    if (!(arquivo instanceof File)) {
      return NextResponse.json({ erro: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer())
    const { linhas, ignorados } = lerPlanilha(buffer, arquivo.name)

    if (linhas.length === 0 && ignorados.length === 0) {
      return NextResponse.json({ erro: 'A planilha está vazia.' }, { status: 400 })
    }

    const { novos, atualizados } = mesclarClientes(linhas)

    return NextResponse.json({
      totalLinhas: linhas.length + ignorados.length,
      novos,
      atualizados,
      ignorados,
    })
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro ao processar o arquivo.'
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
