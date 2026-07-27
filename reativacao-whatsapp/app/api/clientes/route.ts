import { NextRequest, NextResponse } from 'next/server'
import { lerClientes } from '@/lib/store'
import { diasDesde } from '@/lib/datas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const diasMin = Number(searchParams.get('diasMin') ?? '30') || 0
  const ocultarContatados = searchParams.get('ocultarContatados') !== 'false'

  const clientes = lerClientes()
    .map((c) => ({ ...c, diasSemCortar: diasDesde(c.ultimoCorte) }))
    .filter((c) => c.diasSemCortar >= diasMin)
    .filter((c) => !ocultarContatados || !c.contatadoEm)
    .sort((a, b) => b.diasSemCortar - a.diasSemCortar)

  return NextResponse.json({ clientes, total: lerClientes().length })
}
