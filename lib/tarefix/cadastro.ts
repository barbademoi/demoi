import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import { segredoSessao } from '@/lib/tarefix/segredo'

/**
 * Cadastro público do Tarefix.
 * - Conta nova ganha app_metadata.tarefix_only (não abre o BarberMeta).
 * - Limite contra abuso: 3 cadastros por IP por hora e 300 por dia no total.
 * Só o servidor usa este módulo.
 */

type Db = ReturnType<typeof createTarefixAdmin>

export type Uso = 'pessoal' | 'equipe'

const NIVEIS_PADRAO = [
  { percentual: 90, premio: 'R$ 50' },
  { percentual: 100, premio: 'R$ 100' },
]

/** Cria a empresa, liga o dono e o bônus padrão. Desfaz a empresa se o dono falhar. */
export async function criarEmpresaEDono(db: Db, d: { userId: string; nome: string; email: string; empresa: string; criadoPor?: string | null }) {
  const { data: emp, error: erroEmp } = await db.from('empresas').insert({ nome: d.empresa, criado_por: d.criadoPor ?? null }).select('id').single()
  if (erroEmp || !emp) return { ok: false as const, erro: `Erro ao criar a empresa: ${erroEmp?.message}` }
  const { error: erroDono } = await db.from('donos').insert({ id: d.userId, empresa_id: emp.id, nome: d.nome, email: d.email })
  if (erroDono) {
    await db.from('empresas').delete().eq('id', emp.id)
    return { ok: false as const, erro: `Erro ao criar o acesso: ${erroDono.message}` }
  }
  await db.from('bonus_config').insert({ empresa_id: emp.id, ativo: false, mostrar_para_colaborador: true, niveis: NIVEIS_PADRAO })
  return { ok: true as const, empresaId: emp.id as string }
}

function ipHash(): string {
  const h = headers()
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'desconhecido'
  return createHash('sha256').update(`${segredoSessao()}:${ip}`).digest('hex').slice(0, 32)
}

/** Registra a tentativa e diz se ainda pode cadastrar. */
export async function dentroDoLimite(db: Db): Promise<boolean> {
  const hash = ipHash()
  const umaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const umDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ count: doIp }, { count: total }] = await Promise.all([
    db.from('cadastros').select('*', { count: 'exact', head: true }).eq('ip_hash', hash).gte('criado_em', umaHora),
    db.from('cadastros').select('*', { count: 'exact', head: true }).gte('criado_em', umDia),
  ])
  if ((doIp ?? 0) >= 3 || (total ?? 0) >= 300) return false
  await db.from('cadastros').insert({ ip_hash: hash })
  return true
}
