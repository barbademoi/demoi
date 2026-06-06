import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Cliente envia { email, transaction, novaSenha }. Validamos de novo
// SERVER-SIDE todos os critérios (mesmo que a página /boas-vindas já
// tenha validado). Defesa em profundidade contra forja de form.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  email?: string
  transaction?: string
  novaSenha?: string
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = body.email?.toLowerCase().trim()
  const transaction = body.transaction?.trim()
  const novaSenha = body.novaSenha

  if (!email || !transaction || !novaSenha) {
    return NextResponse.json({ error: 'campos_obrigatorios' }, { status: 400 })
  }
  if (novaSenha.length < 8) {
    return NextResponse.json({ error: 'senha_curta' }, { status: 400 })
  }
  if (novaSenha.length > 72) {
    // bcrypt limita em 72 bytes
    return NextResponse.json({ error: 'senha_longa' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Valida compra
  const { data: compra } = await admin
    .from('compras_hotmart')
    .select('usuario_id, status')
    .eq('transaction_id', transaction)
    .eq('email_comprador', email)
    .maybeSingle()

  if (!compra || compra.status !== 'approved' || !compra.usuario_id) {
    return NextResponse.json(
      { error: 'compra_invalida' },
      { status: 403 },
    )
  }

  // Valida que ainda não definiu senha (via app_metadata)
  const { data: userResp } = await admin.auth.admin.getUserById(compra.usuario_id)
  const user = userResp?.user
  if (!user) {
    return NextResponse.json({ error: 'usuario_nao_encontrado' }, { status: 404 })
  }

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  if (appMeta.senha_definida === true) {
    return NextResponse.json({ error: 'senha_ja_definida' }, { status: 409 })
  }

  // Atualiza senha + marca como definida em app_metadata
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    password: novaSenha,
    app_metadata: { ...appMeta, senha_definida: true },
  })

  if (updErr) {
    return NextResponse.json(
      { error: 'update_falhou', detail: updErr.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
