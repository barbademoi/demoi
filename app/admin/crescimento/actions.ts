'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'

export type Tendencia = 'subindo' | 'estavel' | 'caindo' | 'sem_base'

export type PontoSerie = {
  mes: number
  ano: number
  valor: number
  parcial: boolean
}

export type CrescimentoBarbearia = {
  barbeariaId: string
  nome: string
  diaFechamento: number
  /** Data de cadastro da conta — quando adquiriu o BarberMeta. */
  entrouEm: string | null
  serie: PontoSerie[]
  atualParcial: number
  ultimoFechado: number
  anteriorFechado: number
  crescimentoPct: number | null
  tendencia: Tendencia
  // ── Desde o início (varre o histórico inteiro, não só a janela) ──
  primeiroMes: number | null
  primeiroAno: number | null
  primeiroValor: number
  ultimoMes: number | null
  ultimoAno: number | null
  ultimoValor: number
  /** O último mês com dado é o mês corrente, ainda em andamento. */
  ultimoEmAndamento: boolean
  mesesComDados: number
  /** Variação do primeiro mês faturado até o último. Null quando não há base. */
  crescimentoTotal: number | null
  /** Média mensal composta no intervalo. Null quando não há base. */
  crescimentoMensal: number | null
}

/**
 * Evolução do faturamento por barbearia.
 *
 * O cálculo mora na função SQL `admin_crescimento_barbearias` (migration 042),
 * que repete a mesma precedência de faturamento do painel do dono (meta manual
 * primeiro, senão soma dos lançamentos de barbeiros ativos) — os números aqui
 * precisam bater com o que o cliente vê.
 */
export async function listarCrescimentoBarbearias(ciclos = 6): Promise<{
  rows: CrescimentoBarbearia[]
  error?: string
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return { rows: [], error: 'Sem permissão.' }

  const janela = Number.isFinite(ciclos) && ciclos >= 3 && ciclos <= 12 ? Math.round(ciclos) : 6

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .rpc('admin_crescimento_barbearias', { p_ciclos: janela })

  if (error) {
    console.error('[admin/crescimento] erro ao consultar:', error)
    return { rows: [], error: 'Não foi possível carregar o crescimento das barbearias.' }
  }

  const rows = (data ?? []) as Array<{
    barbearia_id: string
    nome: string
    dia_fechamento: number
    entrou_em: string | null
    serie: PontoSerie[] | null
    atual_parcial: string | number
    ultimo_fechado: string | number
    anterior_fechado: string | number
    crescimento_pct: string | number | null
    tendencia: Tendencia
    primeiro_mes: number | null
    primeiro_ano: number | null
    primeiro_valor: string | number
    ultimo_mes: number | null
    ultimo_ano: number | null
    ultimo_valor: string | number
    ultimo_em_andamento: boolean | null
    meses_com_dados: number | null
    crescimento_total: string | number | null
    crescimento_mensal: string | number | null
  }>

  // numeric do Postgres chega como string no supabase-js — converter aqui evita
  // "15000.00" virar texto concatenado na hora de somar/formatar na tela.
  const num = (v: string | number | null | undefined) => Number(v ?? 0) || 0

  return {
    rows: rows.map((r) => ({
      barbeariaId: r.barbearia_id,
      nome: r.nome,
      diaFechamento: Number(r.dia_fechamento) || 1,
      serie: (r.serie ?? []).map((p) => ({
        mes: Number(p.mes),
        ano: Number(p.ano),
        valor: num(p.valor as unknown as string),
        parcial: !!p.parcial,
      })),
      atualParcial: num(r.atual_parcial),
      ultimoFechado: num(r.ultimo_fechado),
      anteriorFechado: num(r.anterior_fechado),
      crescimentoPct: r.crescimento_pct === null ? null : num(r.crescimento_pct),
      tendencia: r.tendencia,
      entrouEm: r.entrou_em,
      primeiroMes: r.primeiro_mes,
      primeiroAno: r.primeiro_ano,
      primeiroValor: num(r.primeiro_valor),
      ultimoMes: r.ultimo_mes,
      ultimoAno: r.ultimo_ano,
      ultimoValor: num(r.ultimo_valor),
      ultimoEmAndamento: !!r.ultimo_em_andamento,
      mesesComDados: Number(r.meses_com_dados) || 0,
      // NULL do banco significa "sem base pra comparar" — não zero.
      crescimentoTotal: r.crescimento_total === null ? null : num(r.crescimento_total),
      crescimentoMensal: r.crescimento_mensal === null ? null : num(r.crescimento_mensal),
    })),
  }
}
