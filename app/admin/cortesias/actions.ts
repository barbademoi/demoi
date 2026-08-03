'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'

/**
 * CONCEDER ACESSO (cortesia vitalícia). Uso exclusivo do dono.
 *
 * PROTEÇÃO NO SERVIDOR (não só na tela): TODA action aqui re-checa que o usuário
 * logado é o e-mail admin (emailEhAdminCortesia) antes de qualquer coisa. Escopo
 * sempre restrito ao e-mail informado — nunca mexe em outra conta.
 *
 * A conta de cortesia nasce:
 *   - Auth: email_confirm=true (já confirmado; senha aleatória descartável — a
 *     pessoa define a dela via "esqueci minha senha").
 *   - usuarios: tipo_acesso='vitalicio', origem='cortesia' → acesso permanente,
 *     FORA de qualquer régua de assinatura/validade. NÃO vincula Hotmart nem
 *     nenhuma transação: cortesia não é venda, não contamina os números.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

// Gate server-side: só o(s) e-mail(s) admin passam. Retorna o user ou null.
async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return null
  return user
}

// A API admin não tem getByEmail — pagina o listUsers até achar ou esgotar.
async function acharAuthUserPorEmail(admin: Admin, email: string) {
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ConcederResult = {
  ok?: boolean
  error?: string
  jaExistia?: boolean
  detalhe?: { email: string }
}

export async function concederAcesso(formData: FormData): Promise<ConcederResult> {
  if (!(await assertAdmin())) return { error: 'Sem permissão.' }

  const email = ((formData.get('email') as string) ?? '').toLowerCase().trim()
  if (!email || !EMAIL_RE.test(email)) return { error: 'Informe um e-mail válido.' }

  const admin: Admin = createAdminClient()

  // ── 1) Já existe conta com esse e-mail? Só (re)marca cortesia — sem duplicar ─
  const { data: usuarioExistente } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (usuarioExistente) {
    await admin
      .from('usuarios')
      .update({ tipo_acesso: 'vitalicio', origem: 'cortesia' })
      .eq('id', (usuarioExistente as { id: string }).id)
    console.log('[cortesias] já existia — remarcada como cortesia vitalícia:', email)
    return { ok: true, jaExistia: true, detalhe: { email } }
  }

  // ── 2) Não existe → cria (ou reaproveita) o Auth user, já confirmado ────────
  // Senha aleatória descartável: ninguém a usa — a pessoa entra por "esqueci
  // minha senha" pra definir a dela.
  const senhaDescartavel = randomUUID() + randomUUID()
  let userId: string
  let reaproveitou = false

  const { data: authData, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password: senhaDescartavel,
    email_confirm: true,
  })

  if (errAuth || !authData?.user) {
    // Provável: e-mail já existe no Auth (criado à mão). Reaproveita e confirma.
    const existente = await acharAuthUserPorEmail(admin, email)
    if (!existente) {
      console.error('[cortesias] erro ao criar auth user:', errAuth)
      return { error: 'Erro ao criar o usuário no Auth.' }
    }
    const { error: errUpd } = await admin.auth.admin.updateUserById(existente.id, { email_confirm: true })
    if (errUpd) {
      console.error('[cortesias] erro ao confirmar auth user existente:', errUpd)
      return { error: 'Erro ao confirmar o usuário no Auth.' }
    }
    userId = existente.id
    reaproveitou = true
  } else {
    userId = authData.user.id
  }

  // ── 3) Cria a barbearia (entra no onboarding no primeiro acesso) ────────────
  const { data: barbearia, error: errBarbearia } = await admin
    .from('barbearias')
    .insert({ nome: 'Barbearia (cortesia)', onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[cortesias] erro ao criar barbearia:', errBarbearia)
    if (!reaproveitou) await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao criar a barbearia.' }
  }
  const barbeariaId = (barbearia as { id: string }).id

  // ── 4) Cria a linha em usuarios — vitalício/cortesia, SEM Hotmart ───────────
  // senha_definida=true + senha_temporaria=false → sem reset obrigatório; a
  // pessoa define a senha via recuperação e loga direto pro onboarding.
  const { error: errUsuario } = await admin
    .from('usuarios')
    .insert({
      id: userId,
      barbearia_id: barbeariaId,
      email,
      senha_definida: true,
      senha_temporaria: false,
      tipo_acesso: 'vitalicio',
      origem: 'cortesia',
    })

  if (errUsuario) {
    console.error('[cortesias] erro ao criar usuario:', errUsuario)
    await admin.from('barbearias').delete().eq('id', barbeariaId)
    if (!reaproveitou) await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao vincular a conta à barbearia.' }
  }

  console.log('[cortesias] acesso de cortesia vitalícia concedido:', email, reaproveitou ? '(auth reaproveitado)' : '')
  return { ok: true, jaExistia: false, detalhe: { email } }
}

export type Cortesia = { email: string; created_at: string }

export async function listarCortesias(): Promise<{ cortesias: Cortesia[]; error?: string }> {
  if (!(await assertAdmin())) return { cortesias: [], error: 'Sem permissão.' }
  const admin: Admin = createAdminClient()
  const { data } = await admin
    .from('usuarios')
    .select('email, created_at')
    .eq('origem', 'cortesia')
    .order('created_at', { ascending: false })
  return { cortesias: (data ?? []) as Cortesia[] }
}
