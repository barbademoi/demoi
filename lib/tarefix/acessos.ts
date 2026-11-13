import { randomInt } from 'crypto'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'

/**
 * Acessos de mentorados: o admin (quem instalou o Tarefix) cria a empresa e a
 * conta de dono de outras pessoas. Cada mentorado vê só a própria empresa (RLS).
 * Só o servidor usa este módulo; quem chama já conferiu que é admin.
 */

export async function ehAdmin(userId: string): Promise<boolean> {
  const { data } = await createTarefixAdmin().from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

/** Senha provisória fácil de ditar: 3 sílabas + 4 números (ex.: "bafemo-4821"). */
export function senhaProvisoria(): string {
  const c = 'bcdfgjklmnprstvz'
  const v = 'aeiou'
  let s = ''
  for (let i = 0; i < 3; i++) s += c[randomInt(c.length)] + v[randomInt(v.length)]
  return `${s}-${String(randomInt(10000)).padStart(4, '0')}`
}

type Auth = ReturnType<typeof createTarefixAdmin>['auth']

/** Procura um usuário pelo e-mail (percorre as páginas do Auth). */
async function usuarioPorEmail(auth: Auth, email: string): Promise<{ id: string } | null> {
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await auth.admin.listUsers({ page: pagina, perPage: 200 })
    if (error || !data) return null
    const achou = data.users.find((u) => u.email?.toLowerCase() === email)
    if (achou) return { id: achou.id }
    if (data.users.length < 200) return null
  }
  return null
}

export type ResultadoConcessao =
  | { ok: true; jaTinhaConta: boolean; senha: string | null; email: string; empresa: string }
  | { ok: false; erro: string }

/**
 * Cria a empresa + o dono para um mentorado.
 * - E-mail já tem conta (ex.: BarberMeta): só liga a conta à nova empresa; a senha dele não muda.
 * - E-mail novo: cria a conta com senha provisória (devolvida para o admin repassar).
 */
export async function concederAcesso(adminId: string, d: { nome: string; email: string; empresa: string }): Promise<ResultadoConcessao> {
  const nome = d.nome.trim().slice(0, 80)
  const email = d.email.trim().toLowerCase()
  const empresa = d.empresa.trim().slice(0, 80)
  if (!nome || !empresa) return { ok: false, erro: 'Preencha o nome e a empresa.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, erro: 'E-mail inválido.' }

  const db = createTarefixAdmin()
  let senha: string | null = null
  let jaTinhaConta = false
  let userId: string | null = null

  const existente = await usuarioPorEmail(db.auth, email)
  if (existente) {
    jaTinhaConta = true
    userId = existente.id
    const { data: jaDono } = await db.from('donos').select('id').eq('id', userId).maybeSingle()
    if (jaDono) return { ok: false, erro: 'Esse e-mail já tem acesso ao Tarefix.' }
  } else {
    senha = senhaProvisoria()
    const { data: criado, error } = await db.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } })
    if (error || !criado.user) return { ok: false, erro: `Não consegui criar a conta: ${error?.message ?? 'erro desconhecido'}` }
    userId = criado.user.id
  }

  const { data: emp, error: erroEmp } = await db.from('empresas').insert({ nome: empresa, criado_por: adminId }).select('id').single()
  if (erroEmp || !emp) return { ok: false, erro: `Erro ao criar a empresa: ${erroEmp?.message}` }
  const { error: erroDono } = await db.from('donos').insert({ id: userId, empresa_id: emp.id, nome, email })
  if (erroDono) {
    await db.from('empresas').delete().eq('id', emp.id)
    return { ok: false, erro: `Erro ao criar o acesso: ${erroDono.message}` }
  }
  await db.from('bonus_config').insert({
    empresa_id: emp.id,
    ativo: false,
    mostrar_para_colaborador: true,
    niveis: [
      { percentual: 90, premio: 'R$ 50' },
      { percentual: 100, premio: 'R$ 100' },
    ],
  })
  return { ok: true, jaTinhaConta, senha, email, empresa }
}

export type EmpresaAcesso = {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
  dono: { nome: string; email: string } | null
  colaboradores: number
  minha: boolean
}

export async function listarAcessos(adminEmpresaId: string): Promise<EmpresaAcesso[]> {
  const db = createTarefixAdmin()
  const [{ data: empresas }, { data: donos }, { data: colabs }] = await Promise.all([
    db.from('empresas').select('id, nome, ativo, criado_em').order('criado_em', { ascending: false }),
    db.from('donos').select('empresa_id, nome, email'),
    db.from('colaboradores').select('empresa_id').eq('ativo', true),
  ])
  const donoPor = Object.fromEntries((donos ?? []).map((d) => [d.empresa_id, { nome: d.nome, email: d.email }]))
  const qtd: Record<string, number> = {}
  for (const c of colabs ?? []) qtd[c.empresa_id] = (qtd[c.empresa_id] ?? 0) + 1
  return (empresas ?? []).map((e) => ({
    id: e.id,
    nome: e.nome,
    ativo: e.ativo !== false,
    criado_em: e.criado_em,
    dono: donoPor[e.id] ?? null,
    colaboradores: qtd[e.id] ?? 0,
    minha: e.id === adminEmpresaId,
  }))
}
