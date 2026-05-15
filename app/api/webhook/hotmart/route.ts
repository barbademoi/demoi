import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  // ── 9. Conta criada — usuário vai definir a senha via /boas-vindas ─────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barbermeta.vercel.app'
  const boasVindasUrl = `${appUrl}/boas-vindas?t=${hotmartTransaction}&e=${encodeURIComponent(email)}`

  console.log('[webhook/hotmart] conta criada com sucesso:', email, '| barbearia:', barbeariaId)
  console.log('[webhook/hotmart] link boas-vindas:', boasVindasUrl)
  return NextResponse.json({ ok: true })
}
