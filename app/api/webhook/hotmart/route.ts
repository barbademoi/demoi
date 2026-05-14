import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

function gerarSenha(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

interface NormalizedPayload {
  event: string
  buyer: { name: string; email: string }
  purchase: { status: string }
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
      purchase: { status: status === 'approved' ? 'APPROVED' : status.toUpperCase() },
    }
  }

  // JSON aninhado (testes manuais / webhook v2 futura)
  const b = fields as {
    event?: string
    data?: { buyer?: { name?: string; email?: string }; purchase?: { status?: string } }
  }
  return {
    event:    b.event ?? '',
    buyer:    {
      email: (b.data?.buyer?.email ?? '').toLowerCase().trim(),
      name:  (b.data?.buyer?.name  ?? '').trim(),
    },
    purchase: { status: b.data?.purchase?.status ?? '' },
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

  const email = buyer.email
  const nome  = buyer.name

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
    .insert({ nome: `Barbearia ${primeiroNome}` })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[webhook/hotmart] erro ao criar barbearia:', errBarbearia)
    return NextResponse.json({ error: 'Failed to create barbearia' }, { status: 500 })
  }

  const barbeariaId: string = (barbearia as { id: string }).id
  console.log('[webhook/hotmart] barbearia criada:', barbeariaId)

  // ── 7. Criar usuário Supabase Auth ────────────────────────────────────────
  const senha = gerarSenha()

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
    .insert({ id: userId, barbearia_id: barbeariaId, email })

  if (errUsuario) {
    console.error('[webhook/hotmart] erro ao criar usuario:', errUsuario)
    await supabase.auth.admin.deleteUser(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create usuario' }, { status: 500 })
  }

  // ── 9. Enviar email de boas-vindas via Resend ─────────────────────────────
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barbermeta.vercel.app'
  const fromEmail = process.env.RESEND_FROM_EMAIL   ?? 'onboarding@resend.dev'
  const resend    = new Resend(process.env.RESEND_API_KEY)

  const { error: errEmail } = await resend.emails.send({
    from:    `BarberMeta <${fromEmail}>`,
    to:      email,
    subject: 'Bem-vindo ao BarberMeta! Acesse sua conta 🎉',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Segoe UI',sans-serif;color:#e8e0d0;">
  <div style="max-width:520px;margin:40px auto;background:#141720;border-radius:16px;overflow:hidden;border:1px solid #2a2d38;">

    <!-- Header -->
    <div style="background:#141720;padding:36px 40px 28px;text-align:center;border-bottom:1px solid #2a2d38;">
      <h1 style="margin:0;font-size:28px;color:#e8e0d0;font-weight:400;letter-spacing:-0.5px;">
        Barber<span style="color:#c5a028;">Meta</span>
      </h1>
      <p style="margin:8px 0 0;color:#8b8fa8;font-size:13px;">Gestão de metas para barbearias</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="margin:0 0 8px;color:#8b8fa8;font-size:13px;">Olá, ${primeiroNome}!</p>
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:400;color:#e8e0d0;">
        Sua conta está pronta.
      </h2>
      <p style="margin:0 0 28px;color:#8b8fa8;font-size:14px;line-height:1.6;">
        Use as credenciais abaixo para acessar o BarberMeta e começar a configurar sua barbearia.
      </p>

      <!-- Credenciais -->
      <div style="background:#0d0f14;border-radius:12px;padding:20px 24px;margin-bottom:28px;border:1px solid #2a2d38;">
        <div style="margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#8b8fa8;">Email</p>
          <p style="margin:0;font-size:15px;color:#e8e0d0;">${email}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#8b8fa8;">Senha temporária</p>
          <p style="margin:0;font-size:18px;color:#c5a028;font-family:monospace;letter-spacing:2px;">${senha}</p>
        </div>
      </div>

      <!-- CTA -->
      <a href="${appUrl}/login" style="display:block;text-align:center;background:#c5a028;color:#0d0f14;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:600;margin-bottom:28px;">
        Acessar o BarberMeta →
      </a>

      <p style="margin:0;font-size:12px;color:#8b8fa8;line-height:1.6;">
        Após o primeiro acesso, recomendamos alterar a senha nas configurações da conta.<br>
        Em caso de dúvidas, responda este email.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #2a2d38;text-align:center;">
      <p style="margin:0;font-size:11px;color:#4a4d5e;">
        © ${new Date().getFullYear()} BarberMeta. Esta mensagem foi gerada automaticamente.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })

  if (errEmail) {
    console.error('[webhook/hotmart] erro ao enviar email:', errEmail)
  }

  console.log('[webhook/hotmart] conta criada com sucesso:', email, '| barbearia:', barbeariaId)
  return NextResponse.json({ ok: true })
}
