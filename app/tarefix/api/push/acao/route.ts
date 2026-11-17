import { NextResponse } from 'next/server'
import { executarAcao, type AcaoPush } from '@/lib/tarefix/acaoPush'

// Botões da notificação ("Feito" / "Adiar 15 min"), chamados pelo service worker.
// Autorização: o passe assinado que veio dentro da própria notificação.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  let corpo: { passe?: string; acao?: string } = {}
  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  }
  const acao = corpo.acao === 'feito' || corpo.acao === 'adiar' ? (corpo.acao as AcaoPush) : null
  if (!acao || typeof corpo.passe !== 'string') return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  try {
    const r = await executarAcao(corpo.passe, acao)
    return NextResponse.json(r, { status: r.ok ? 200 : 403 })
  } catch (e) {
    console.error('[tarefix acao push]', e)
    return NextResponse.json({ ok: false, erro: 'Falha ao registrar.' }, { status: 500 })
  }
}
