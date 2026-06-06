import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Chamado pelo /trocar-senha-obrigatorio APÓS o cliente alterar a senha
// via supabase.auth.updateUser (que só consegue mexer na própria sessão).
// Aqui marcamos senha_definida=true em app_metadata (precisa service role)
// e limpamos a senha_temporaria do banco.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'sem_sessao' }, { status: 401 })
  }

  const admin = createAdminClient()

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...appMeta, senha_definida: true },
  })

  if (updErr) {
    return NextResponse.json(
      { error: 'update_falhou', detail: updErr.message },
      { status: 500 },
    )
  }

  // Limpa senha_temporaria em todas as compras desse user (idempotente)
  await admin
    .from('compras_hotmart')
    .update({ senha_temporaria: null })
    .eq('usuario_id', user.id)

  return NextResponse.json({ ok: true })
}
