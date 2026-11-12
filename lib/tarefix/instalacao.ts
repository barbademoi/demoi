import { createClient } from '@supabase/supabase-js'
import { createTarefixAdmin } from '@/lib/tarefix/supabase/admin'
import sql1 from '@/supabase/tarefix/001_estrutura.sql'
import sql2 from '@/supabase/tarefix/002_rls.sql'
import sql3 from '@/supabase/tarefix/003_storage.sql'
import sql4 from '@/supabase/tarefix/004_horario_tempo.sql'
import sql5 from '@/supabase/tarefix/005_horario_inicio.sql'
import sql6 from '@/supabase/tarefix/006_tarefas_dia_todo.sql'
import sql7 from '@/supabase/tarefix/007_observacoes.sql'

/** SQL completo de instalação, numa transação só (se der erro, nada fica pela metade). */
export const SQL_INSTALACAO = ['begin;', sql1, sql2, sql3, sql4, sql5, sql6, sql7, 'commit;'].join('\n\n')

export const VARIAVEIS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const

export type EstadoInstalacao = {
  variaveisOk: boolean
  conexaoErro: string | null
  sqlRodou: boolean
  schemaExposto: boolean
  temDono: boolean
  linkSqlEditor: string | null
  linkApiSettings: string | null
}

/** ref do projeto a partir da URL (https://REF.supabase.co) */
function refDoProjeto(): string | null {
  const m = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)
  return m ? m[1] : null
}

export async function estadoInstalacao(): Promise<EstadoInstalacao> {
  const variaveisOk = VARIAVEIS.every((v) => Boolean(process.env[v]))
  const ref = refDoProjeto()
  const estado: EstadoInstalacao = {
    variaveisOk,
    conexaoErro: null,
    sqlRodou: false,
    schemaExposto: false,
    temDono: false,
    linkSqlEditor: ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : null,
    linkApiSettings: ref ? `https://supabase.com/dashboard/project/${ref}/settings/api` : null,
  }
  if (!variaveisOk) return estado

  try {
    // 1) O SQL já rodou? (função de marcação no schema public, sempre visível na API)
    const publico = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: marca, error: erroMarca } = await publico.rpc('tarefix_instalado')
    if (erroMarca) {
      const naoExiste = erroMarca.code === 'PGRST202' || erroMarca.code === '42883' || /could not find|does not exist/i.test(erroMarca.message)
      if (!naoExiste) estado.conexaoErro = erroMarca.message
      return estado
    }
    estado.sqlRodou = marca === '1'

    // 2) O schema "tarefix" está exposto na API?
    const db = createTarefixAdmin()
    const { count, error } = await db.from('donos').select('*', { count: 'exact', head: true })
    if (error) {
      const naoExposto = error.code === 'PGRST106' || /schema must be one of/i.test(error.message)
      if (!naoExposto) estado.conexaoErro = error.message
      return estado
    }
    estado.schemaExposto = true
    estado.temDono = (count ?? 0) > 0
  } catch (e) {
    estado.conexaoErro = e instanceof Error ? e.message : String(e)
  }
  return estado
}
