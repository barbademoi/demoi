import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mpPayment } from '@/lib/mercadopago'

function gerarSenhaInterna(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

function validarAssinatura(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string,
): boolean {
  const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1]
  const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1]
  if (!ts || !v1) return false
  const template = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const hash = createHmac('sha256', secret).update(template).digest('hex')
  return hash === v1
}

export async function POST(request: NextRequest) {
  // ── 1. Valida assinatura ──────────────────────────────────────────────────
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook/mp] MP_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const dataId = String((body.data as Record<string, unknown>)?.id ?? '')

  if (xSignature && secret) {
    if (!validarAssinatura(xSignature, xRequestId, dataId, secret)) {
      console.warn('[webhook/mp] assinatura inválida')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── 2. Só processa notificações de pagamento ───────────────────────────────
  const tipo = body.type ?? body.topic
  if (tipo !== 'payment') {
    console.log('[webhook/mp] notificação ignorada, tipo:', tipo)
    return NextResponse.json({ ok: true })
  }

  if (!dataId) {
    console.warn('[webhook/mp] data.id ausente')
    return NextResponse.json({ error: 'Missing data.id' }, { status: 400 })
  }

  console.log('[webhook/mp] payment_id:', dataId)

  // ── 3. Busca detalhes do pagamento via API do MP ───────────────────────────
  let payment: Record<string, unknown>
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment = (await mpPayment.get({ id: Number(dataId) })) as unknown as Record<string, unknown>
  } catch (err) {
    console.error('[webhook/mp] erro ao buscar pagamento:', err)
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
  }

  const status         = payment.status as string
  const externalRef    = payment.external_reference as string | undefined
  const payerEmail     = ((payment.payer as Record<string, unknown>)?.email as string ?? '').toLowerCase().trim()
  const additionalInfoPayer = ((payment.additional_info as Record<string, unknown>)?.payer as Record<string, unknown> | undefined)
  const payerName      = (additionalInfoPayer?.first_name as string | undefined)
                      ?? ((payment.payer as Record<string, unknown>)?.first_name as string | undefined)
                      ?? ''

  console.log('[webhook/mp] status:', status, '| external_ref:', externalRef, '| email:', payerEmail)

  const admin = createAdminClient()

  // ── 4. Idempotência: já processamos esse payment_id com approved? ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jaProcessado } = await (admin as any)
    .from('compras_pendentes')
    .select('id')
    .eq('mp_payment_id', dataId)
    .eq('status', 'approved')
    .maybeSingle()

  if (jaProcessado) {
    console.log('[webhook/mp] payment já processado:', dataId)
    return NextResponse.json({ ok: true })
  }

  // ── 5. Atualiza status para rejected/refunded ─────────────────────────────
  if (status === 'rejected' || status === 'refunded' || status === 'cancelled') {
    if (externalRef) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('compras_pendentes')
        .update({ status, mp_payment_id: dataId })
        .eq('id', externalRef)
    }
    console.log('[webhook/mp] pagamento', status, '| ref:', externalRef)
    return NextResponse.json({ ok: true })
  }

  // ── 6. Só processa approved ───────────────────────────────────────────────
  if (status !== 'approved') {
    console.log('[webhook/mp] status ignorado:', status)
    return NextResponse.json({ ok: true })
  }

  if (!externalRef) {
    console.warn('[webhook/mp] external_reference ausente no payment')
    return NextResponse.json({ ok: true })
  }

  // ── 7. Busca compra_pendente ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: compra } = await (admin as any)
    .from('compras_pendentes')
    .select('id, email, nome, usuario_id')
    .eq('id', externalRef)
    .maybeSingle()

  if (!compra) {
    console.warn('[webhook/mp] compra_pendente não encontrada:', externalRef)
    return NextResponse.json({ ok: true })
  }

  // Já criou o usuário para esta compra?
  if ((compra as { usuario_id: string | null }).usuario_id) {
    console.log('[webhook/mp] usuário já criado para compra:', externalRef)
    // Apenas atualiza status se ainda estava pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('compras_pendentes')
      .update({ status: 'approved', mp_payment_id: dataId, approved_at: new Date().toISOString() })
      .eq('id', externalRef)
      .eq('status', 'pending')
    return NextResponse.json({ ok: true })
  }

  const email = (compra as { email: string }).email
  const nome  = payerName || (compra as { nome: string }).nome

  // ── 8. Idempotência: email já tem conta? ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioExistente } = await (admin as any)
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (usuarioExistente) {
    console.log('[webhook/mp] email já cadastrado:', email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('compras_pendentes')
      .update({
        status: 'approved',
        mp_payment_id: dataId,
        approved_at: new Date().toISOString(),
        usuario_id: (usuarioExistente as { id: string }).id,
      })
      .eq('id', externalRef)
    return NextResponse.json({ ok: true })
  }

  // ── 9. Cria barbearia ─────────────────────────────────────────────────────
  const primeiroNome = nome.split(' ')[0] || 'Dono'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbearia, error: errBarbearia } = await (admin as any)
    .from('barbearias')
    .insert({ nome: `Barbearia ${primeiroNome}`, onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[webhook/mp] erro ao criar barbearia:', errBarbearia)
    return NextResponse.json({ error: 'Failed to create barbearia' }, { status: 500 })
  }

  const barbeariaId: string = (barbearia as { id: string }).id

  // ── 10. Cria usuário Auth ─────────────────────────────────────────────────
  const { data: authData, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password: gerarSenhaInterna(),
    email_confirm: true,
    user_metadata: { nome },
  })

  if (errAuth || !authData.user) {
    console.error('[webhook/mp] erro ao criar auth user:', errAuth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const userId = authData.user.id

  // ── 11. Cria linha em usuarios ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errUsuario } = await (admin as any)
    .from('usuarios')
    .insert({ id: userId, barbearia_id: barbeariaId, email, senha_definida: false })

  if (errUsuario) {
    console.error('[webhook/mp] erro ao criar usuario:', errUsuario)
    await admin.auth.admin.deleteUser(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create usuario' }, { status: 500 })
  }

  // ── 12. Marca compra como aprovada ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from('compras_pendentes')
    .update({
      status:       'approved',
      mp_payment_id: dataId,
      approved_at:  new Date().toISOString(),
      usuario_id:   userId,
    })
    .eq('id', externalRef)

  console.log('[webhook/mp] conta criada com sucesso:', email, '| barbearia:', barbeariaId, '| compra:', externalRef)
  return NextResponse.json({ ok: true })
}
