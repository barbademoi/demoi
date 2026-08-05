'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'

export type NivelUso = 'diaria' | 'frequente' | 'esporadica' | 'inativa'

export type UsoBarbearia = {
  barbeariaId: string
  nome: string
  diasAtivos: number
  ultimoUso: string | null
  diasParado: number | null
  barbeiros: number
  usaMensal: boolean
  uso: NivelUso
}

/**
 * Lista as barbearias classificadas por intensidade de uso.
 *
 * O cálculo mora na função SQL `admin_uso_barbearias` (migration 041), que
 * cruza as três fontes de atividade diária. Aqui só validamos o admin e
 * traduzimos as colunas — a função é security definer e só o service_role
 * executa, então esta checagem é a porta de entrada.
 */
export async function listarUsoBarbearias(dias = 30): Promise<{
  rows: UsoBarbearia[]
  error?: string
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return { rows: [], error: 'Sem permissão.' }

  const janela = Number.isFinite(dias) && dias >= 7 && dias <= 180 ? Math.round(dias) : 30

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .rpc('admin_uso_barbearias', { p_dias: janela })

  if (error) {
    console.error('[admin/uso] erro ao consultar:', error)
    return { rows: [], error: 'Não foi possível carregar o uso das barbearias.' }
  }

  const rows = (data ?? []) as Array<{
    barbearia_id: string
    nome: string
    dias_ativos: number
    ultimo_uso: string | null
    dias_parado: number | null
    barbeiros: number
    usa_mensal: boolean
    uso: NivelUso
  }>

  return {
    rows: rows.map((r) => ({
      barbeariaId: r.barbearia_id,
      nome: r.nome,
      diasAtivos: Number(r.dias_ativos) || 0,
      ultimoUso: r.ultimo_uso,
      diasParado: r.dias_parado === null ? null : Number(r.dias_parado),
      barbeiros: Number(r.barbeiros) || 0,
      usaMensal: !!r.usa_mensal,
      uso: r.uso,
    })),
  }
}
