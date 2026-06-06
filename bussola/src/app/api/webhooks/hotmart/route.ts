import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  gerarSenhaTemporaria,
  statusDeEvento,
  type HotmartWebhookPayload,
} from '@/lib/hotmart'

// Webhook Hotmart. Recebe eventos de compra (approved/refunded/canceled).
// Cria usuário no Supabase Auth + estabelecimento na primeira aprovação.
// Idempotente: chamadas repetidas com mesmo transaction_id não duplicam.
// Sempre retorna 2xx pra Hotmart (mesmo em erro lógico) — exceto HOTTOK
// inválido, que retorna 401 pra Hotmart parar de tentar.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let payload: HotmartWebhookPayload
  try {
    payload = (await request.json()) as HotmartWebhookPayload
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // 1) Validação HOTTOK — header preferido, fallback no body
  const hottok =
    request.headers.get('x-hotmart-hottok') ||
    request.headers.get('X-HOTMART-HOTTOK') ||
    payload.hottok ||
    ''

  const expected = process.env.HOTMART_HOTTOK
  if (!expected) {
    console.error('[hotmart-webhook] HOTMART_HOTTOK ausente nas env vars')
    return NextResponse.json({ error: 'config_missing' }, { status: 500 })
  }
  if (hottok !== expected) {
    return NextResponse.json({ error: 'invalid_hottok' }, { status: 401 })
  }

  // 2) Eventos que ignoramos retornam 200 (Hotmart não retenta)
  const status = statusDeEvento(payload.event)
  if (!status) {
    return NextResponse.json({ ok: true, ignored: payload.event })
  }

  const data = payload.data
  const transactionId = data?.purchase?.transaction
  const email = data?.buyer?.email?.toLowerCase().trim()
  const nome = data?.buyer?.name ?? null
  const produtoId = String(data?.product?.id ?? '')
  const valor = data?.purchase?.price?.value ?? null

  if (!transactionId || !email || !produtoId) {
    return NextResponse.json(
      { error: 'payload_incomplete' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  // 3) Idempotência — busca compra existente pelo transaction_id
  const { data: existente } = await admin
    .from('compras_hotmart')
    .select('id, status, usuario_id, estabelecimento_id')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  // ─── REFUND / CANCELAMENTO ───
  if (status === 'refunded' || status === 'canceled') {
    if (existente?.estabelecimento_id) {
      await admin
        .from('estabelecimentos')
        .update({ ativo: false })
        .eq('id', existente.estabelecimento_id)
    }
    await admin
      .from('compras_hotmart')
      .upsert(
        {
          transaction_id: transactionId,
          email_comprador: email,
          nome_comprador: nome,
          produto_id: produtoId,
          valor_pago: valor,
          status,
          raw_payload: payload as unknown as Record<string, unknown>,
        },
        { onConflict: 'transaction_id' },
      )
    return NextResponse.json({ ok: true, status })
  }

  // ─── APPROVED ───

  // Já processado? Retorna sucesso sem repetir.
  if (existente?.status === 'approved' && existente?.usuario_id) {
    return NextResponse.json({ ok: true, already_processed: true })
  }

  // Verifica se já existe usuário com esse email (Hotmart pode webhookar
  // 2x antes de a primeira chamada terminar; ou usuário foi criado por
  // outra via). Não tem listUsers por email, então tentamos criar e em
  // caso de "email already registered" reusamos.
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
    // "User already registered" — vamos buscar pelo email via listUsers.
    // O list só retorna até 1000 por página; pra base pequena, ok.
    const msg = (criarErr.message ?? '').toLowerCase()
    const jaExiste = msg.includes('already') || msg.includes('exists')
    if (!jaExiste) {
      console.error('[hotmart-webhook] erro createUser', criarErr)
      return NextResponse.json(
        { error: 'auth_create_failed', detail: criarErr.message },
        { status: 500 },
      )
    }
    // Encontra o usuário existente pelo email.
    const { data: lista } = await admin.auth.admin.listUsers()
    const existing = lista?.users.find(
      (u) => u.email?.toLowerCase() === email,
    )
    if (!existing) {
      return NextResponse.json(
        { error: 'user_lookup_failed' },
        { status: 500 },
      )
    }
    userId = existing.id
  } else {
    userId = criado?.user?.id ?? null
  }

  if (!userId) {
    return NextResponse.json({ error: 'no_user_id' }, { status: 500 })
  }

  // Verifica se já tem estabelecimento desse dono. Se sim, reusa
  // (compra adicional de outro produto, ou re-execução).
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
      .insert({
        nome: nomeEmpresa,
        dono_id: userId,
        ativo: true,
      })
      .select('id')
      .single()
    if (estabErr) {
      console.error('[hotmart-webhook] erro criar estabelecimento', estabErr)
      return NextResponse.json(
        { error: 'estab_create_failed', detail: estabErr.message },
        { status: 500 },
      )
    }
    estabelecimentoId = estabCriado.id
  } else {
    // Reativa caso tenha sido desativado em refund anterior.
    await admin
      .from('estabelecimentos')
      .update({ ativo: true })
      .eq('id', estabelecimentoId)
  }

  // Salva/atualiza linha em compras_hotmart. Inclui senha_temporaria pra
  // exibição na tela /entrar logo após o redirect da Hotmart. Será
  // apagada (UPDATE NULL) quando cliente criar senha definitiva.
  await admin.from('compras_hotmart').upsert(
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

  return NextResponse.json({
    ok: true,
    status: 'approved',
    usuario_id: userId,
    estabelecimento_id: estabelecimentoId,
  })
}
