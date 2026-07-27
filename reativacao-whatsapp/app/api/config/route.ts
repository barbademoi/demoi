import { NextRequest, NextResponse } from 'next/server'
import { lerConfig, salvarConfig } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(lerConfig())
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const instrucaoBase = (body?.instrucaoBase as string | undefined)?.trim()

  if (!instrucaoBase) {
    return NextResponse.json({ erro: 'instrucaoBase é obrigatória.' }, { status: 400 })
  }

  salvarConfig({ instrucaoBase })
  return NextResponse.json({ ok: true })
}
