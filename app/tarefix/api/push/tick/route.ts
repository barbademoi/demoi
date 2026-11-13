import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { chavesVapid } from '@/lib/tarefix/push'
import { rodarTick } from '@/lib/tarefix/pushAgendado'

// Chamado a cada 5 min pelo agendador do Supabase (pg_cron + pg_net).
// Protegido pelo segredo guardado em tarefix.push_config (cabeçalho x-tarefix-cron).
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

async function autorizado(req: Request) {
  const recebido = req.headers.get('x-tarefix-cron') ?? ''
  if (!recebido) return false
  const { segredo } = await chavesVapid()
  const a = Buffer.from(recebido)
  const b = Buffer.from(segredo)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function tratar(req: Request) {
  if (!(await autorizado(req))) return NextResponse.json({ erro: 'não autorizado' }, { status: 401 })
  try {
    const r = await rodarTick()
    return NextResponse.json(r)
  } catch (e) {
    console.error('[tarefix push tick]', e)
    return NextResponse.json({ erro: 'falha no tick' }, { status: 500 })
  }
}

export const GET = tratar
export const POST = tratar
