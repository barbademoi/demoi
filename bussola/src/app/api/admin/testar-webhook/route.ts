import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/admin'
import { processarPayloadHotmart } from '@/lib/hotmartProcessor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Dispara um PURCHASE_APPROVED fake com email fornecido pra validar que
// todo o fluxo está funcionando. Não envia pra Hotmart, só processa
// localmente. Útil pra confirmar config após mudanças no banco/env.
export async function POST(request: Request) {
  const adminCheck = await checkAdmin()
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.motivo }, { status: adminCheck.status })
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const email = body.email?.toLowerCase().trim()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email_invalido' }, { status: 400 })
  }

  const transactionId = `TESTE-${Date.now()}`

  const payloadFake = {
    event: 'PURCHASE_APPROVED' as const,
    data: {
      buyer: { email, name: 'Teste Admin' },
      product: { id: 0, name: 'Bússola Teste' },
      purchase: {
        transaction: transactionId,
        price: { value: 0, currency_value: 'BRL' },
        status: 'APPROVED',
      },
    },
  }

  const resultado = await processarPayloadHotmart(payloadFake)

  return NextResponse.json({
    test: true,
    transaction_id: transactionId,
    resultado,
  })
}
