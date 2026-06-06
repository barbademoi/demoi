import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/admin'
import { createAdminClient } from '@/utils/supabase/admin'
import { processarPayloadHotmart } from '@/lib/hotmartProcessor'
import type { HotmartWebhookPayload } from '@/lib/hotmart'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Reprocessa um webhook anterior usando o payload salvo em
// webhooks_recebidos. Útil quando processamento original falhou (tabela
// inexistente, env var faltando, etc) e foi corrigido o ambiente.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const adminCheck = await checkAdmin()
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.motivo }, { status: adminCheck.status })
  }

  const admin = createAdminClient()

  const { data: webhook } = await admin
    .from('webhooks_recebidos')
    .select('id, payload, tentativas')
    .eq('id', params.id)
    .maybeSingle()

  if (!webhook) {
    return NextResponse.json({ error: 'webhook_nao_encontrado' }, { status: 404 })
  }

  const resultado = await processarPayloadHotmart(
    webhook.payload as unknown as HotmartWebhookPayload,
  )

  const novaContagem = (webhook.tentativas ?? 0) + 1
  if (resultado.ok) {
    await admin
      .from('webhooks_recebidos')
      .update({
        processado: true,
        processado_em: new Date().toISOString(),
        erro_processamento: null,
        tentativas: novaContagem,
        ultima_tentativa_em: new Date().toISOString(),
      })
      .eq('id', params.id)
  } else {
    await admin
      .from('webhooks_recebidos')
      .update({
        processado: false,
        erro_processamento: `${resultado.erro}${resultado.detalhe ? ': ' + resultado.detalhe : ''}`,
        tentativas: novaContagem,
        ultima_tentativa_em: new Date().toISOString(),
      })
      .eq('id', params.id)
  }

  return NextResponse.json(resultado)
}
