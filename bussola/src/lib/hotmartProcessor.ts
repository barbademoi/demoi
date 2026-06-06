// Processador da lógica de negócio do webhook Hotmart. Isolado do
// endpoint pra ser reutilizável (chamado também pelo /api/admin/
// reprocessar-webhook). Recebe payload bruto e cria/atualiza usuário,
// estabelecimento e linha em compras_hotmart conforme o evento.

import { createAdminClient } from '@/utils/supabase/admin'
import { gerarSenhaTemporaria, statusDeEvento, type HotmartWebhookPayload } from './hotmart'

export type ResultadoProcessamento =
  | {
      ok: true
      status: string
      transactionId?: string
      usuarioId?: string | null
      estabelecimentoId?: string | null
      ignorado?: boolean
      jaProcessado?: boolean
    }
  | {
      ok: false
      erro: string
      detalhe?: string
      transactionId?: string
    }

export async function processarPayloadHotmart(
  payload: HotmartWebhookPayload,
): Promise<ResultadoProcessamento> {
  const statusEvt = statusDeEvento(payload.event)

  // Evento ignorado (PURCHASE_BILLET_PRINTED etc) — não é erro
  if (!statusEvt) {
    return { ok: true, status: 'ignored', ignorado: true }
  }

  const data = payload.data
  const transactionId = data?.purchase?.transaction
  const email = data?.buyer?.email?.toLowerCase().trim()
  const nome = data?.buyer?.name ?? null
  const produtoId = String(data?.product?.id ?? '')
  const valor = data?.purchase?.price?.value ?? null

  if (!transactionId || !email || !produtoId) {
    return { ok: false, erro: 'payload_incompleto', transactionId }
  }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('compras_hotmart')
    .select('id, status, usuario_id, estabelecimento_id')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  // ─── REFUND / CANCELAMENTO ───
  if (statusEvt === 'refunded' || statusEvt === 'canceled') {
    if (existente?.estabelecimento_id) {
      await admin
        .from('estabelecimentos')
        .update({ ativo: false })
        .eq('id', existente.estabelecimento_id)
    }
    await admin.from('compras_hotmart').upsert(
      {
        transaction_id: transactionId,
        email_comprador: email,
        nome_comprador: nome,
        produto_id: produtoId,
        valor_pago: valor,
        status: statusEvt,
        raw_payload: payload as unknown as Record<string, unknown>,
      },
      { onConflict: 'transaction_id' },
    )
    return { ok: true, status: statusEvt, transactionId }
  }

  // ─── APPROVED ───

  if (existente?.status === 'approved' && existente?.usuario_id) {
    return {
      ok: true,
      status: 'approved',
      transactionId,
      jaProcessado: true,
      usuarioId: existente.usuario_id,
      estabelecimentoId: existente.estabelecimento_id,
    }
  }

  let userId: string | null = null
  const senhaTemp = gerarSenhaTemporaria()

  const { data: criado, error: criarErr } = await admin.auth.admin.createUser({
    email,
    password: senhaTemp,
    email_confirm: true,
    user_metadata: { nome, fonte: 'hotmart' },
    app_metadata: { senha_definida: false },
  })

  if (criarErr) {
    const msg = (criarErr.message ?? '').toLowerCase()
    const jaExiste = msg.includes('already') || msg.includes('exists')
    if (!jaExiste) {
      return {
        ok: false,
        erro: 'auth_create_failed',
        detalhe: criarErr.message,
        transactionId,
      }
    }
    const { data: lista } = await admin.auth.admin.listUsers()
    const existing = lista?.users.find((u) => u.email?.toLowerCase() === email)
    if (!existing) {
      return { ok: false, erro: 'user_lookup_failed', transactionId }
    }
    userId = existing.id
  } else {
    userId = criado?.user?.id ?? null
  }

  if (!userId) {
    return { ok: false, erro: 'sem_user_id', transactionId }
  }

  const { data: estabExistente } = await admin
    .from('estabelecimentos')
    .select('id')
    .eq('dono_id', userId)
    .maybeSingle()

  let estabelecimentoId = estabExistente?.id ?? null

  if (!estabelecimentoId) {
    const nomeEmpresa = nome ? `Empresa de ${nome.split(' ')[0]}` : 'Minha empresa'
    const { data: estabCriado, error: estabErr } = await admin
      .from('estabelecimentos')
      .insert({ nome: nomeEmpresa, dono_id: userId, ativo: true })
      .select('id')
      .single()
    if (estabErr) {
      return {
        ok: false,
        erro: 'estab_create_failed',
        detalhe: estabErr.message,
        transactionId,
      }
    }
    estabelecimentoId = estabCriado.id
  } else {
    await admin
      .from('estabelecimentos')
      .update({ ativo: true })
      .eq('id', estabelecimentoId)
  }

  const { error: compraErr } = await admin.from('compras_hotmart').upsert(
    {
      transaction_id: transactionId,
      email_comprador: email,
      nome_comprador: nome,
      produto_id: produtoId,
      valor_pago: valor,
      status: 'approved',
      usuario_id: userId,
      estabelecimento_id: estabelecimentoId,
      senha_temporaria: senhaTemp,
      raw_payload: payload as unknown as Record<string, unknown>,
    },
    { onConflict: 'transaction_id' },
  )

  if (compraErr) {
    return {
      ok: false,
      erro: 'compra_upsert_failed',
      detalhe: compraErr.message,
      transactionId,
    }
  }

  return {
    ok: true,
    status: 'approved',
    transactionId,
    usuarioId: userId,
    estabelecimentoId,
  }
}
