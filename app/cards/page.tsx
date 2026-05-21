import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CardsClient from './CardsClient'
import { cicloDeData } from '@/lib/ciclo'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

type UsuarioComBarbearia = { barbearia_id: string; barbearias: { id: string; nome: string; dia_fechamento: number | null } }
type MetaComIndividuais = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  metas_individuais: MetaIndividual[]
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string; tipo?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, dia_fechamento)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const diaFechamento = barbearia.dia_fechamento ?? 1
  const hoje = new Date()
  // (mes, ano) representam o INÍCIO do ciclo (consistente com indexação das tabelas)
  const mes = parseInt(searchParams.mes ?? '0') || cicloDeData(hoje, diaFechamento).mesRef
  const ano = parseInt(searchParams.ano ?? '0') || cicloDeData(hoje, diaFechamento).anoRef
  const tipo = (searchParams.tipo ?? 'resultado') as 'inicio' | 'resultado'

  // Ciclo atual (do mes/ano vindos do searchParam ou do hoje)
  const ciclo = cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)
  // Ciclo anterior (pra comparar deltas)
  const dataInicioCicloAnterior = new Date(ciclo.inicio)
  dataInicioCicloAnterior.setMonth(dataInicioCicloAnterior.getMonth() - 1)
  const cicloAnterior = cicloDeData(dataInicioCicloAnterior, diaFechamento)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, faturamento_acumulado, metas_individuais(*)')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as unknown as MetaComIndividuais | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancamentosRaw } = await (supabase as any)
    .from('lancamentos')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]
  const lancamentos = (lancamentosRaw ?? []) as Lancamento[]
  const totalEquipe = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const faturamentoAcumulado = (meta as unknown as { faturamento_acumulado?: number })?.faturamento_acumulado ?? 0

  // ── Lançamentos diários — delta por barbeiro ─────────────
  // Compara somatório do ciclo atual (até hoje, se for o ciclo corrente) com o mesmo
  // "ponto" do ciclo anterior (mesmos N primeiros dias úteis pra comparação justa).
  const cicloEhCorrente = hoje >= ciclo.inicio && hoje <= ciclo.fim
  const ldFinalIso = cicloEhCorrente
    ? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
    : ciclo.fimIso

  // No ciclo anterior, compara até o mesmo número de dias do início (alinhamento justo)
  const diasJaCorridos = Math.max(
    1,
    Math.floor((new Date(ldFinalIso).getTime() - ciclo.inicio.getTime()) / 86400000) + 1,
  )
  const dataFimAnterior = new Date(cicloAnterior.inicio)
  dataFimAnterior.setDate(dataFimAnterior.getDate() + diasJaCorridos - 1)
  const cicloAntFimIsoComparavel = dataFimAnterior > cicloAnterior.fim ? cicloAnterior.fimIso :
    `${dataFimAnterior.getFullYear()}-${String(dataFimAnterior.getMonth() + 1).padStart(2, '0')}-${String(dataFimAnterior.getDate()).padStart(2, '0')}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAtualRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia.id)
    .gte('data', ciclo.inicioIso)
    .lte('data', ldFinalIso)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAnteriorRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia.id)
    .gte('data', cicloAnterior.inicioIso)
    .lte('data', cicloAntFimIsoComparavel)

  const ldAtualMap: Record<string, number> = {}
  for (const r of (ldAtualRaw ?? []) as { barbeiro_id: string; valor: number }[]) {
    ldAtualMap[r.barbeiro_id] = (ldAtualMap[r.barbeiro_id] ?? 0) + Number(r.valor)
  }
  const ldAnteriorMap: Record<string, number> = {}
  for (const r of (ldAnteriorRaw ?? []) as { barbeiro_id: string; valor: number }[]) {
    ldAnteriorMap[r.barbeiro_id] = (ldAnteriorMap[r.barbeiro_id] ?? 0) + Number(r.valor)
  }

  const deltaMap: Record<string, number | null> = {}
  for (const b of barbeiros) {
    const atual = ldAtualMap[b.id] ?? 0
    const anterior = ldAnteriorMap[b.id] ?? 0
    deltaMap[b.id] = anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : null
  }

  return (
    <CardsClient
      barbeiros={barbeiros}
      meta={meta}
      lancamentos={lancamentos}
      totalEquipe={totalEquipe}
      faturamentoAcumulado={faturamentoAcumulado}
      barbeariaName={barbearia.nome}
      mes={mes}
      ano={ano}
      tipo={tipo}
      deltaMap={deltaMap}
      cicloLabel={ciclo.label}
      diaFechamento={diaFechamento}
    />
  )
}
