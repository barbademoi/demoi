'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'admin'
}

// Procura um usuário no Auth pelo email (a API admin não tem getByEmail,
// então paginamos o listUsers até achar ou esgotar).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function acharAuthUserPorEmail(admin: any, email: string) {
  const alvo = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return null
    const achado = (data?.users ?? []).find(
      (u: { email?: string }) => (u.email ?? '').toLowerCase() === alvo,
    )
    if (achado) return achado
    if (!data?.users || data.users.length < 200) break
  }
  return null
}

type CriarContaResult = {
  ok?: boolean
  error?: string
  aviso?: string
  detalhe?: { email: string; barbearia: string; barbeariaId: string }
}

/**
 * Provisiona uma conta manualmente (sem passar pelo fluxo de compra).
 * Cria — ou reaproveita, se já existir — o usuário no Auth, cria a barbearia
 * e a linha em `usuarios` que liga os dois. A conta nasce com senha temporária:
 * no primeiro login o dono é obrigado a trocá-la e depois faz o onboarding.
 */
export async function criarContaManual(formData: FormData): Promise<CriarContaResult> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }

  const email       = (formData.get('email')          as string ?? '').toLowerCase().trim()
  const nomeBarbearia = (formData.get('nome_barbearia') as string ?? '').trim()
  const senha       = (formData.get('senha')          as string ?? '').trim() || '123456'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Informe um email válido.' }
  }
  if (!nomeBarbearia) return { error: 'Informe o nome da barbearia.' }
  if (senha.length < 6) return { error: 'A senha temporária precisa ter ao menos 6 caracteres.' }

  const admin = createAdminClient()

  // ── Já existe conta configurada pra esse email? ──────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioExistente } = await (admin as any)
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (usuarioExistente) {
    return { error: 'Já existe uma conta configurada para esse email.' }
  }

  // ── Cria a barbearia ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbearia, error: errBarbearia } = await (admin as any)
    .from('barbearias')
    .insert({ nome: nomeBarbearia, onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[admin/contas] erro ao criar barbearia:', errBarbearia)
    return { error: 'Erro ao criar a barbearia.' }
  }
  const barbeariaId: string = (barbearia as { id: string }).id

  // ── Cria (ou reaproveita) o usuário no Auth ──────────────────────────────
  let reaproveitou = false
  let userId: string

  const { data: authData, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (errAuth || !authData?.user) {
    // Email provavelmente já existe no Auth (ex.: criado à mão no painel).
    // Reaproveita: acha o usuário, confirma o email e reseta a senha.
    const existente = await acharAuthUserPorEmail(admin, email)
    if (!existente) {
      console.error('[admin/contas] erro ao criar auth user:', errAuth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('barbearias').delete().eq('id', barbeariaId)
      return { error: 'Erro ao criar o usuário no Auth.' }
    }
    const { error: errUpd } = await admin.auth.admin.updateUserById(existente.id, {
      password: senha,
      email_confirm: true,
    })
    if (errUpd) {
      console.error('[admin/contas] erro ao atualizar auth user existente:', errUpd)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('barbearias').delete().eq('id', barbeariaId)
      return { error: 'Erro ao atualizar o usuário existente no Auth.' }
    }
    userId = existente.id
    reaproveitou = true
  } else {
    userId = authData.user.id
  }

  // ── Cria a linha em usuarios (o vínculo que faltava) ─────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errUsuario } = await (admin as any)
    .from('usuarios')
    .insert({
      id: userId,
      barbearia_id: barbeariaId,
      email,
      senha_definida: true,
      senha_temporaria: true,
    })

  if (errUsuario) {
    console.error('[admin/contas] erro ao criar usuario:', errUsuario)
    // Só apaga o Auth user se fomos nós que o criamos agora.
    if (!reaproveitou) await admin.auth.admin.deleteUser(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('barbearias').delete().eq('id', barbeariaId)
    return { error: 'Erro ao vincular o usuário à barbearia.' }
  }

  console.log('[admin/contas] conta provisionada:', email, '| barbearia:', barbeariaId, reaproveitou ? '(auth reaproveitado)' : '')

  return {
    ok: true,
    aviso: reaproveitou
      ? 'Usuário já existia no Auth — reaproveitei e resetei a senha.'
      : undefined,
    detalhe: { email, barbearia: nomeBarbearia, barbeariaId },
  }
}
