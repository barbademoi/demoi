import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import sql1 from '../../supabase/migrations/001_estrutura.sql'
import sql2 from '../../supabase/migrations/002_rls.sql'
import sql3 from '../../supabase/migrations/003_storage.sql'

/** SQL completo de instalação, numa transação só (se der erro, nada fica pela metade). */
export const SQL_INSTALACAO = ['begin;', sql1, sql2, sql3, 'commit;'].join('\n\n')

export const VARIAVEIS = [
  { nome: 'NEXT_PUBLIC_SUPABASE_URL', ondeAchar: 'Project URL' },
  { nome: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', ondeAchar: 'chave anon / publishable' },
  { nome: 'SUPABASE_SERVICE_ROLE_KEY', ondeAchar: 'chave service_role / secret' },
] as const

export type EstadoInstalacao = {
  variaveisOk: boolean
  variaveis: { nome: string; ondeAchar: string; ok: boolean }[]
  conexaoErro: string | null
  bancoOk: boolean
  temDono: boolean
  linkSqlEditor: string | null
}

/** ref do projeto a partir da URL (https://REF.supabase.co) */
function refDoProjeto(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const m = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)
  return m ? m[1] : null
}

export async function estadoInstalacao(): Promise<EstadoInstalacao> {
  const variaveis = VARIAVEIS.map((v) => ({ ...v, ok: Boolean(process.env[v.nome]) }))
  const variaveisOk = variaveis.every((v) => v.ok)
  const ref = refDoProjeto()
  const estado: EstadoInstalacao = {
    variaveisOk,
    variaveis,
    conexaoErro: null,
    bancoOk: false,
    temDono: false,
    linkSqlEditor: ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : null,
  }
  if (!variaveisOk) return estado

  try {
    const db = createAdminClient()
    const { count, error } = await db.from('donos').select('*', { count: 'exact', head: true })
    if (error) {
      // Tabela inexistente = banco ainda não instalado. Outros erros = chave/URL erradas.
      const naoInstalado = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message)
      if (!naoInstalado) estado.conexaoErro = error.message
      return estado
    }
    estado.bancoOk = true
    estado.temDono = (count ?? 0) > 0
  } catch (e) {
    estado.conexaoErro = e instanceof Error ? e.message : String(e)
  }
  return estado
}
