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
  // (mes, ano) = início do ciclo (do searchParam ou do hoje)
  const cicloHoje = cicloDeData(hoje, diaFechamento)
  const mesAtual = cicloHoje.mesRef
  const anoAtual = cicloHoje.anoRef
  const mesParam = searchParams.mes ? parseInt(searchParams.mes) : 0
  const anoParam = searchParams.ano ? parseInt(searchParams.ano) : 0
  // Validação leve + piso 2024-01.
  let mes = mesAtual
  let ano = anoAtual
  if (mesParam >= 1 && mesParam <= 12 && anoParam >= 2024) {
    mes = mesParam
    ano = anoParam
  }
  const ehPeriodoAtual = mes === mesAtual && ano === anoAtual
  const ehPeriodoPassado = ano < anoAtual || (ano === anoAtual && mes < mesAtual)
  // Ciclo selecionado (a partir do mes/ano de início)
  const ciclo = cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)
  const tipo = (searchParams.tipo ?? 'resultado') as 'inicio' | 'resultado'

  // Navegação: piso 2024-01; futuro só se metas configuradas no próximo período.
  const podeVoltar = !(ano === 2024 && mes === 1)
  let nextMes = mes + 1, nextAno = ano
  if (nextMes > 12) { nextMes = 1; nextAno += 1 }
  const nextEhFuturo = nextAno > anoAtual || (nextAno === anoAtual && nextMes > mesAtual)
  let podeAvancar = !nextEhFuturo
  if (nextEhFuturo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: nextMeta } = await (supabase as any)
      .from('metas').select('id')
      .eq('barbearia_id', barbearia.id).eq('mes', nextMes).eq('ano', nextAno)
      .maybeSingle()
    podeAvancar = !!nextMeta
  }

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

  // ── Lançamentos diários — delta por barbeiro (dentro do ciclo) ──
  // Ciclo anterior pra comparar (mesmo dia de fechamento, mês antes)
  const inicioCicloAnt = new Date(ciclo.inicio)
  inicioCicloAnt.setMonth(inicioCicloAnt.getMonth() - 1)
  const cicloAnt = cicloDeData(inicioCicloAnt, diaFechamento)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAtualRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia.id)
    .gte('data', ciclo.inicioIso)
    .lte('data', ciclo.fimIso)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldAnteriorRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, valor')
    .eq('barbearia_id', barbearia.id)
    .gte('data', cicloAnt.inicioIso)
    .lte('data', cicloAnt.fimIso)

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
      mesCorrente={mesAtual}
      anoCorrente={anoAtual}
      ehPeriodoPassado={ehPeriodoPassado}
      podeVoltar={podeVoltar}
      podeAvancar={podeAvancar}
      tipo={tipo}
      deltaMap={deltaMap}
      cicloLabel={ciclo.label}
      diaFechamento={diaFechamento}
    />
  )
}
