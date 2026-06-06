import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { gerarSenhaTemporaria } from '@/lib/hotmart'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Body {
  email?: string
}

// Esqueci-senha sem email: gera nova senha temporária e retorna na
// resposta pra ser mostrada na tela. Marca senha_definida=false pra
// forçar troca obrigatória no primeiro login.
export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = body.email?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'email_obrigatorio' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Busca usuário pelo email. Sem getUserByEmail nativo na SDK; usamos
  // listUsers (limite 1000 por página, suficiente pra base atual).
  const { data: lista } = await admin.auth.admin.listUsers()
  const user = lista?.users.find((u) => u.email?.toLowerCase() === email)
  if (!user) {
    return NextResponse.json({ error: 'email_nao_encontrado' }, { status: 404 })
  }

  // Se tem estabelecimento e foi desativado por refund, bloqueia.
  const { data: estab } = await admin
    .from('estabelecimentos')
    .select('ativo')
    .eq('dono_id', user.id)
    .maybeSingle()
  if (estab && estab.ativo === false) {
    return NextResponse.json({ error: 'conta_suspensa' }, { status: 403 })
  }

  // Gera nova senha temporária
  const novaSenha = gerarSenhaTemporaria()

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    password: novaSenha,
    app_metadata: { ...appMeta, senha_definida: false },
  })
  if (updErr) {
    console.error('[nova-senha-temp] erro updateUserById', updErr)
    return NextResponse.json({ error: 'update_falhou' }, { status: 500 })
  }

  // Atualiza senha_temporaria nas compras do user (idempotente; se
  // o user não veio da Hotmart, simplesmente não tem linha pra atualizar)
  await admin
    .from('compras_hotmart')
    .update({ senha_temporaria: novaSenha })
    .eq('usuario_id', user.id)
    .eq('status', 'approved')

  return NextResponse.json({ ok: true, senha: novaSenha })
}
