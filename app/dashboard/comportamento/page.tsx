import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import ComportamentoClient from './ComportamentoClient'
import { cicloAtual, cicloDeData, hojeBrasil } from '@/lib/ciclo'
import { dataLocalStr } from '@/lib/utils'
import type { RegraConduta, OcorrenciaConduta } from '@/types/database'

export const dynamic = 'force-dynamic'

type OcorrenciaRow = OcorrenciaConduta & { barbeiros: { nome: string } | null }

// Módulo PRIVADO do dono. A página exige sessão autenticada; a RLS garante
// que só o dono da barbearia lê regras/ocorrências. O barbeiro (link público,
// anon key) nunca chega aqui e nem consegue ler as tabelas.
export default async function ComportamentoPage({
  searchParams,
}: { searchParams?: { mes?: string; ano?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, comportamento_ativo, dia_fechamento)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string; comportamento_ativo: boolean; dia_fechamento: number | null } } | null }
  if (!usuario?.barbearias) redirect('/login')
  const barbearia = usuario.barbearias

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regrasRaw } = await (supabase as any)
    .from('regras_conduta')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .order('created_at', { ascending: true })
  const regras = (regrasRaw ?? []) as RegraConduta[]

  // Conduta aplica a todo mundo que trabalha (barbeiros e recepcionistas).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, tipo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = ((barbeirosRaw ?? []) as { id: string; nome: string; tipo: string }[])

  // ── Ciclo (26→25) selecionado via ?mes&ano, default = ciclo atual ──
  const diaFechamento = barbearia.dia_fechamento ?? 1
  const hoje = hojeBrasil()
  const cicloHoje = cicloAtual(diaFechamento, hoje)
  const mesAtual = cicloHoje.mesRef
  const anoAtual = cicloHoje.anoRef

  const mesParam = parseInt(searchParams?.mes ?? '', 10)
  const anoParam = parseInt(searchParams?.ano ?? '', 10)
  let mes = mesAtual, ano = anoAtual
  if (Number.isFinite(mesParam) && Number.isFinite(anoParam) && mesParam >= 1 && mesParam <= 12 && anoParam >= 2024) {
    mes = mesParam; ano = anoParam
  }
  const ehPeriodoAtual = mes === mesAtual && ano === anoAtual
  const ciclo = ehPeriodoAtual ? cicloHoje : cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)

  const podeVoltar = !(ano === 2024 && mes === 1)
  const podeAvancar = !ehPeriodoAtual && !(ano > anoAtual || (ano === anoAtual && mes > mesAtual))

  // Ocorrências do ciclo (só quando o módulo está ativo). RLS + filtro por
  // barbearia_id garantem que só vêm as desta barbearia.
  let ocorrencias: OcorrenciaRow[] = []
  if (barbearia.comportamento_ativo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ocRaw } = await (supabase as any)
      .from('ocorrencias_conduta')
      .select('id, barbearia_id, barbeiro_id, regra_id, descricao, valor, observacao, data, ciente_em, created_at, barbeiros(nome)')
      .eq('barbearia_id', barbearia.id)
      .gte('data', ciclo.inicioIso)
      .lte('data', ciclo.fimIso)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })
    ocorrencias = (ocRaw ?? []) as OcorrenciaRow[]
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <ComportamentoClient
          ativoInicial={barbearia.comportamento_ativo}
          regrasIniciais={regras}
          barbeiros={barbeiros}
          hojeStr={dataLocalStr(hoje)}
          ocorrencias={ocorrencias.map(o => ({
            id: o.id,
            barbeiro_id: o.barbeiro_id,
            barbeiroNome: o.barbeiros?.nome ?? '—',
            descricao: o.descricao,
            valor: Number(o.valor) || 0,
            observacao: o.observacao,
            data: o.data,
            cienteEm: o.ciente_em,
          }))}
          cicloNav={{ mes, ano, mesAtual, anoAtual, diaFechamento, podeVoltar, podeAvancar, label: ciclo.label }}
        />
      </div>
    </div>
  )
}
