import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL  ?? 'https://www.barbermeta.com.br'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL    ?? 'onboarding@resend.dev'

async function enviarEmailConvite(email: string, nome: string, link: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[webhook/hotmart] RESEND_API_KEY ausente — pulando email')
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const primeiroNome = nome.split(' ')[0] || 'tudo bem'

  await resend.emails.send({
    from:    `BarberMeta <${FROM_EMAIL}>`,
    to:      email,
    subject: 'Seu acesso ao BarberMeta — defina sua senha',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Segoe UI',sans-serif;color:#e8e0d0;">
  <div style="max-width:520px;margin:40px auto;background:#141720;border-radius:16px;overflow:hidden;border:1px solid #2a2d38;">
    <div style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2a2d38;">
      <h1 style="margin:0;font-size:28px;color:#e8e0d0;font-weight:400;">
        Barber<span style="color:#c5a028;">Meta</span>
      </h1>
      <p style="margin:8px 0 0;color:#8b8fa8;font-size:13px;">Gestão de metas para barbearias</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="margin:0 0 6px;color:#8b8fa8;font-size:13px;">Olá, ${primeiroNome}!</p>
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:400;color:#e8e0d0;">
        Sua compra foi confirmada. 🎉
      </h2>
      <p style="margin:0 0 24px;color:#b6bccc;font-size:14px;line-height:1.6;">
        Para acessar sua conta, clique no botão abaixo e defina uma senha:
      </p>
      <a href="${link}" style="display:block;text-align:center;background:#c5a028;color:#0d0f14;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:24px;">
        Definir senha e acessar →
      </a>
      <p style="margin:0 0 20px;color:#8b8fa8;font-size:12px;line-height:1.6;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="${link}" style="color:#c5a028;word-break:break-all;">${link}</a>
      </p>
      <p style="margin:0;font-size:12px;color:#8b8fa8;line-height:1.6;">
        Dúvidas? Responda este email ou escreva para
        <a href="mailto:suporte@barbermeta.com.br" style="color:#c5a028;">suporte@barbermeta.com.br</a>
      </p>
    </div>
    <div style="padding:16px 40px;border-top:1px solid #2a2d38;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4a4d5e;">
        © ${new Date().getFullYear()} BarberMeta · Cássia / MG
      </p>
    </div>
  </div>
</body>
</html>`.trim(),
  })
}

function gerarSenhaInterna(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

interface NormalizedPayload {
  event: string
  buyer: { name: string; email: string }
  purchase: { status: string; transaction: string }
}

// Detecta a fonte do hottok e retorna valor + descrição para log
function resolveHottok(
  headers: Headers,
  searchParams: URLSearchParams,
  fields: Record<string, unknown>,
): { value: string | null; source: string } {
  const candidates: [string | null, string][] = [
    [headers.get('x-hotmart-hottok'), 'header:x-hotmart-hottok'],
    [headers.get('x-hotmart-hottoken'), 'header:x-hotmart-hottoken'],
    [searchParams.get('hottok'), 'query:hottok'],
    [typeof fields.hottok === 'string' ? fields.hottok : null, 'body:hottok'],
  ]
  for (const [value, source] of candidates) {
    if (value) return { value, source }
  }
  return { value: null, source: 'none' }
}

// Normaliza v1 (form-urlencoded flat) e v2/testes (JSON aninhado) para estrutura interna
function normalizePayload(
  fields: Record<string, unknown>,
  isFormData: boolean,
): NormalizedPayload {
  if (isFormData) {
    const f = fields as Record<string, string>
    const status = (f.status ?? '').toLowerCase()
    const statusToEvent: Record<string, string> = {
      approved:   'PURCHASE_APPROVED',
      canceled:   'PURCHASE_CANCELED',
      refunded:   'PURCHASE_REFUNDED',
      chargeback: 'PURCHASE_CHARGEBACK',
      expired:    'PURCHASE_EXPIRED',
    }
    const event = statusToEvent[status] ?? `PURCHASE_${status.toUpperCase()}`
    const name = (f.name || [f.first_name, f.last_name].filter(Boolean).join(' ')).trim()
    return {
      event,
      buyer:    { email: (f.email ?? '').toLowerCase().trim(), name },
      purchase: {
        status:      status === 'approved' ? 'APPROVED' : status.toUpperCase(),
        transaction: (f.transaction ?? f.trk ?? '').trim(),
      },
    }
  }

  // JSON aninhado (testes manuais / webhook v2 futura)
  const b = fields as {
    event?: string
    data?: {
      buyer?: { name?: string; email?: string }
      purchase?: { status?: string; transaction?: string }
    }
  }
  return {
    event:    b.event ?? '',
    buyer:    {
      email: (b.data?.buyer?.email ?? '').toLowerCase().trim(),
      name:  (b.data?.buyer?.name  ?? '').trim(),
    },
    purchase: {
      status:      b.data?.purchase?.status ?? '',
      transaction: (b.data?.purchase?.transaction ?? '').trim(),
    },
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Ler body raw ───────────────────────────────────────────────────────
  const rawBody     = await request.text()
  const contentType = request.headers.get('content-type') ?? ''
  const isFormData  = contentType.includes('application/x-www-form-urlencoded')
  console.log('[webhook/hotmart] content-type:', contentType)

  // ── 2. Parse do body ──────────────────────────────────────────────────────
  let fields: Record<string, unknown> = {}
  if (isFormData) {
    const params = new URLSearchParams(rawBody)
    params.forEach((v, k) => { fields[k] = v })
  } else {
    try {
      fields = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
  }

  // ── 3. Validar Hottok ─────────────────────────────────────────────────────
  const secret = process.env.HOTMART_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook/hotmart] HOTMART_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const { value: hottok, source: hottokSource } = resolveHottok(
    request.headers,
    request.nextUrl.searchParams,
    fields,
  )
  console.log('[webhook/hotmart] hottok source:', hottokSource)

  if (hottok !== secret) {
    console.warn('[webhook/hotmart] token inválido | source:', hottokSource)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 4. Normalizar payload ─────────────────────────────────────────────────
  const payload = normalizePayload(fields, isFormData)
  const { buyer, purchase } = payload
  console.log('[webhook/hotmart] event:', payload.event, '| email:', buyer.email, '| nome:', buyer.name)

  if (payload.event !== 'PURCHASE_APPROVED') {
    console.log('[webhook/hotmart] evento ignorado:', payload.event)
    return NextResponse.json({ ok: true, message: 'Event ignored' })
  }

  if (!buyer.email || !buyer.name || purchase.status !== 'APPROVED') {
    console.warn('[webhook/hotmart] payload inválido:', { email: buyer.email, name: buyer.name, status: purchase.status })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const email           = buyer.email
  const nome            = buyer.name
  const hotmartTransaction = purchase.transaction

  // ── 5. Idempotência: checar se email já está cadastrado ───────────────────
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existente } = await (supabase as any)
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existente) {
    console.log('[webhook/hotmart] email já cadastrado:', email)
    return NextResponse.json({ ok: true, message: 'Already registered' })
  }

  // ── 6. Criar barbearia ────────────────────────────────────────────────────
  const primeiroNome = nome.split(' ')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbearia, error: errBarbearia } = await (supabase as any)
    .from('barbearias')
    .insert({ nome: `Barbearia ${primeiroNome}`, onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[webhook/hotmart] erro ao criar barbearia:', errBarbearia)
    return NextResponse.json({ error: 'Failed to create barbearia' }, { status: 500 })
  }

  const barbeariaId: string = (barbearia as { id: string }).id
  console.log('[webhook/hotmart] barbearia criada:', barbeariaId)

  // ── 7. Criar usuário Supabase Auth ────────────────────────────────────────
  const senha = gerarSenhaInterna()

  const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (errAuth || !authData.user) {
    console.error('[webhook/hotmart] erro ao criar auth user:', errAuth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const userId = authData.user.id
  console.log('[webhook/hotmart] auth user criado:', userId)

  // ── 8. Criar linha em usuarios ────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errUsuario } = await (supabase as any)
    .from('usuarios')
    .insert({
      id: userId,
      barbearia_id: barbeariaId,
      email,
      senha_definida: false,
      hotmart_transaction: hotmartTransaction || null,
    })

  if (errUsuario) {
    console.error('[webhook/hotmart] erro ao criar usuario:', errUsuario)
    await supabase.auth.admin.deleteUser(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create usuario' }, { status: 500 })
  }

  // ── 9. Conta criada — envia email de convite com link pro /boas-vindas ─────
  const boasVindasUrl = `${APP_URL}/boas-vindas?t=${hotmartTransaction}&e=${encodeURIComponent(email)}`

  try {
    await enviarEmailConvite(email, nome, boasVindasUrl)
    console.log('[webhook/hotmart] email enviado:', email)
  } catch (err) {
    console.error('[webhook/hotmart] erro ao enviar email:', err)
    // Não falha o webhook — usuário já foi criado, pode pedir reenvio
  }

  console.log('[webhook/hotmart] conta criada com sucesso:', email, '| barbearia:', barbeariaId)
  return NextResponse.json({ ok: true })
}
