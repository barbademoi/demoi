import { NextRequest, NextResponse } from 'next/server'
import { marcarContatado } from '@/lib/clientes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const id = body?.id as string | undefined
  const contatado = body?.contatado !== false // default true

  if (!id) {
    return NextResponse.json({ erro: 'id do cliente é obrigatório.' }, { status: 400 })
  }

  const cliente = marcarContatado(id, contatado)
  if (!cliente) {
    return NextResponse.json({ erro: 'Cliente não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ cliente })
}
