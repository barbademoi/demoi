'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { sanearFiltros, type FiltrosCrescimento } from './filtros'

export type MotivoInconfiavel =
  | 'sem_lancamento'
  | 'so_mes_em_curso'
  | 'base_fraca'
  | 'poucos_dias'
  | 'poucos_meses'

export type PontoSerie = {
  mes: number
  ano: number
  valor: number
  dias: number
  parcial: boolean
  acimaPiso: boolean
  bemAlimentado: boolean
  valido: boolean
}

export type CrescimentoBarbearia = {
  barbeariaId: string
  nome: string
  /** Cidade do cadastro. null quando o dono nunca preencheu. */
  cidade: string | null
  /** Barbeiros ATIVOS — inativado não infla o time num card que vira post. */
  qtdBarbeiros: number
  diaFechamento: number
  entrouEm: string | null
  serie: PontoSerie[]
  atualParcial: number
  /** Passou nos 3 filtros: meses fechados suficientes, acima do piso, bem alimentados. */
  confiavel: boolean
  motivo: MotivoInconfiavel | null
  mesesValidos: number
  // Comparação entre os dois meses válidos mais recentes
  refMes: number | null
  refAno: number | null
  refValor: number
  antMes: number | null
  antAno: number | null
  antValor: number
  /** Os dois meses comparados são vizinhos no calendário. */
  consecutivos: boolean | null
  crescimentoPct: number | null
  /** Acima do teto de plausibilidade — exibido, mas fora das estatísticas. */
  outlier: boolean
  primeiroMes: number | null
  primeiroAno: number | null
  primeiroValor: number
  crescimentoTotal: number | null
}

/**
 * Crescimento por barbearia, já separado entre dado confiável e insuficiente.
 *
 * Os filtros moram na função SQL `admin_crescimento_barbearias` (migration
 * 044): só mês FECHADO, acima do piso de faturamento e com lançamento em dias
 * suficientes entra na conta. Isso é o que impede um mês de teste de R$ 48 de
 * virar denominador e produzir +197.816%.
 */
export async function listarCrescimentoBarbearias(filtros: Partial<FiltrosCrescimento> = {}): Promise<{
  rows: CrescimentoBarbearia[]
  filtros: FiltrosCrescimento
  error?: string
}> {
  const f = sanearFiltros(filtros)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return { rows: [], filtros: f, error: 'Sem permissão.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .rpc('admin_crescimento_barbearias', {
      p_ciclos: f.ciclos,
      p_piso_faturamento: f.piso,
      p_dias_minimos: f.diasMinimos,
      p_meses_minimos: f.mesesMinimos,
      p_outlier_pct: f.outlierPct,
    })

  if (error) {
    console.error('[admin/crescimento] erro ao consultar:', error)
    return { rows: [], filtros: f, error: 'Não foi possível carregar o crescimento das barbearias.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  // numeric do Postgres chega como string no supabase-js.
  const num = (v: unknown) => Number(v ?? 0) || 0

  return {
    filtros: f,
    rows: rows.map((r) => ({
      barbeariaId: r.barbearia_id,
      nome: r.nome,
      cidade: r.cidade ?? null,
      qtdBarbeiros: Number(r.qtd_barbeiros) || 0,
      diaFechamento: Number(r.dia_fechamento) || 1,
      entrouEm: r.entrou_em,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serie: ((r.serie ?? []) as any[]).map((p) => ({
        mes: Number(p.mes), ano: Number(p.ano), valor: num(p.valor), dias: Number(p.dias) || 0,
        parcial: !!p.parcial, acimaPiso: !!p.acimaPiso,
        bemAlimentado: !!p.bemAlimentado, valido: !!p.valido,
      })),
      atualParcial: num(r.atual_parcial),
      confiavel: !!r.confiavel,
      motivo: (r.motivo ?? null) as MotivoInconfiavel | null,
      mesesValidos: Number(r.meses_validos) || 0,
      refMes: r.ref_mes, refAno: r.ref_ano, refValor: num(r.ref_valor),
      antMes: r.ant_mes, antAno: r.ant_ano, antValor: num(r.ant_valor),
      consecutivos: r.consecutivos === null || r.consecutivos === undefined ? null : !!r.consecutivos,
      // NULL do banco = sem base pra comparar. Não é zero.
      crescimentoPct: r.crescimento_pct === null || r.crescimento_pct === undefined ? null : num(r.crescimento_pct),
      outlier: !!r.outlier,
      primeiroMes: r.primeiro_mes, primeiroAno: r.primeiro_ano, primeiroValor: num(r.primeiro_valor),
      crescimentoTotal: r.crescimento_total === null || r.crescimento_total === undefined ? null : num(r.crescimento_total),
    })),
  }
}
