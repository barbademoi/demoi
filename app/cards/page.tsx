import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CardsClient from './CardsClient'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

type UsuarioComBarbearia = { barbearia_id: string; barbearias: { id: string; nome: string } }
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
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const hoje = new Date()
  const mes = parseInt(searchParams.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(searchParams.ano ?? String(hoje.getFullYear()))
  const tipo = (searchParams.tipo ?? 'resultado') as 'inicio' | 'resultado'

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
    />
  )
}
