import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { processarPayloadHotmart } from '@/lib/hotmartProcessor'
import { normalizarPayload, type HotmartWebhookPayload } from '@/lib/hotmart'

// Webhook Hotmart resiliente.
//
// Camada 1 (sempre): salva o payload bruto em webhooks_recebidos ANTES
// de qualquer processamento. Mesmo que a lógica de negócio quebre
// (tabela inexistente, env var faltando, bug novo), o payload fica
// registrado e pode ser reprocessado depois via /api/admin/reprocessar.
//
// Camada 2: tenta processar. Sucesso ou erro são marcados no mesmo
// registro de webhooks_recebidos.
//
// HOTTOK inválido retorna 401 (Hotmart para de tentar). Outros casos
// retornam 200 (sucesso lógico ou registrado pra reprocessar).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // 1) Lê body e tenta entender o formato.
  // Hotmart v1 (descontinuado): envia application/x-www-form-urlencoded
  //                              com campos flat (transaction=, email=, hottok=)
  // Hotmart v2 (atual):          envia application/json aninhado em data.*
  // Aceita ambos.
  const rawText = await request.text()
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase()

  let raw: unknown = null
  try {
    if (contentType.includes('application/x-www-form-urlencoded')) {
      raw = Object.fromEntries(new URLSearchParams(rawText))
    } else {
      // Tenta JSON. Algumas variantes da Hotmart enviam JSON sem
      // Content-Type correto, então é o caminho mais seguro.
      try {
        raw = JSON.parse(rawText)
      } catch {
        // Último recurso: form-urlencoded mesmo sem Content-Type apontando
        raw = Object.fromEntries(new URLSearchParams(rawText))
      }
    }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const payload = normalizarPayload(raw)
  if (!payload) {
    return NextResponse.json(
      { error: 'payload_nao_reconhecido', formato: 'nem_v1_nem_v2' },
      { status: 400 },
    )
  }

  // 2) Valida HOTTOK (header preferido; v1 vem no body)
  const hottok =
    request.headers.get('x-hotmart-hottok') ||
    request.headers.get('X-HOTMART-HOTTOK') ||
    payload?.hottok ||
    ''
  const expected = process.env.HOTMART_HOTTOK
  const hottokValido = !!expected && hottok === expected

  // Sem HOTTOK configurado é falha do servidor — não dá pra confiar em nada
  if (!expected) {
    console.error('[hotmart-webhook] HOTMART_HOTTOK ausente nas env vars')
    return NextResponse.json({ error: 'config_missing' }, { status: 500 })
  }
  if (!hottokValido) {
    return NextResponse.json({ error: 'invalid_hottok' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 3) Salva sempre. Se a tabela ainda não existe, segue mesmo assim pra
  // tentar processar (não bloqueia o webhook). Loga erro pra alarme.
  let webhookId: string | null = null
  try {
    const { data, error } = await admin
      .from('webhooks_recebidos')
      .insert({
        origem: 'hotmart',
        event: payload?.event ?? null,
        payload: payload as unknown as Record<string, unknown>,
        hottok_valido: hottokValido,
      })
      .select('id')
      .single()
    if (error) throw error
    webhookId = data.id
  } catch (e) {
    console.error('[hotmart-webhook] falha salvar webhooks_recebidos', e)
    // Não retorna erro pra Hotmart — continua tentando processar
  }

  // 4) Processa
  const resultado = await processarPayloadHotmart(payload as HotmartWebhookPayload)

  // 5) Marca status do webhook registrado
  if (webhookId) {
    if (resultado.ok) {
      await admin
        .from('webhooks_recebidos')
        .update({
          processado: true,
          processado_em: new Date().toISOString(),
          erro_processamento: null,
          tentativas: 1,
          ultima_tentativa_em: new Date().toISOString(),
        })
        .eq('id', webhookId)
    } else {
      await admin
        .from('webhooks_recebidos')
        .update({
          processado: false,
          erro_processamento: `${resultado.erro}${resultado.detalhe ? ': ' + resultado.detalhe : ''}`,
          tentativas: 1,
          ultima_tentativa_em: new Date().toISOString(),
        })
        .eq('id', webhookId)
    }
  }

  // 6) Sempre 200 quando registramos. A Hotmart não precisa retentar:
  // se algo falhou, está salvo e pode ser reprocessado via admin.
  if (resultado.ok) {
    return NextResponse.json({
      ok: true,
      status: resultado.status,
      transaction_id: resultado.transactionId,
      ignorado: resultado.ignorado,
      ja_processado: resultado.jaProcessado,
      webhook_id: webhookId,
    })
  }
  return NextResponse.json({
    ok: false,
    erro: resultado.erro,
    detalhe: resultado.detalhe,
    transaction_id: resultado.transactionId,
    webhook_id: webhookId,
  })
}
