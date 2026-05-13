import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { nomeMes, calcDiasUteis } from '@/lib/utils'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import LogoUpload from '@/components/dashboard/LogoUpload'
import FaturamentoEdit from '@/components/dashboard/FaturamentoEdit'
import ModoMesSelector from '@/components/dashboard/ModoMesSelector'
import CampanhaModal from '@/components/dashboard/CampanhaModal'
import CampanhaToggle from '@/components/dashboard/CampanhaToggle'
import Sidebar from '@/components/dashboard/Sidebar'
import DashboardMain from '@/components/dashboard/DashboardMain'
import { calcProgresso, calcTier } from '@/lib/utils'
import type { Barbeiro, MetaIndividual, Lancamento, ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario } from '@/types/database'

type UsuarioComBarbearia = {
  barbearia_id: string
  barbearias: { id: string; nome: string; logo_url: string | null }
}

type MetaSimples = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  faturamento_acumulado: number
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, logo_url)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()
  const diaAtual = hoje.getDate()
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const diasRestantes = diasNoMes - diaAtual
  const { diasUteisCorridos, diasUteisRestantes } = calcDiasUteis(ano, mes, diaAtual)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, faturamento_acumulado')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as MetaSimples | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metasIndRaw } = meta ? await (supabase as any)
    .from('metas_individuais')
    .select('*')
    .eq('meta_id', meta.id) : { data: null }

  const metasIndividuais = (metasIndRaw ?? []) as MetaIndividual[]

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

  // ── Cálculos gerais ─────────────────────────────────────
  const totalComissoes = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const faturamentoExibido = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalComissoes
  const progressoColetivo = meta ? calcProgresso(faturamentoExibido, meta.meta_coletiva) : 0

  const ranking = [...barbeiros]
    .map(b => ({
      ...b,
      comissao: lancamentos.find(l => l.barbeiro_id === b.id)?.comissao_acumulada ?? 0,
      metaInd: metasIndividuais.find(m => m.barbeiro_id === b.id) ?? null,
    }))
    .sort((a, b) => b.comissao - a.comissao)

  const rankingBarbeiros = ranking.filter(b => b.tipo !== 'recepcionista')
  const rankingRecepcionistas = ranking.filter(b => b.tipo === 'recepcionista')

  // ── Gamificação ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modoRaw } = await (supabase as any)
    .from('modo_mes').select('modo').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
  const modoAtual: ModoPontos = (modoRaw?.modo as ModoPontos) ?? 'metas'

  let campanha: CampanhaComDetalhes | null = null
  let pontosMap: Record<string, number> = {}

  if (modoAtual !== 'metas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campRaw } = await (supabase as any)
      .from('campanha').select('*').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
    if (campRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: servicosRaw } = await (supabase as any)
        .from('campanha_servicos').select('*').eq('campanha_id', campRaw.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: premiosRaw } = await (supabase as any)
        .from('campanha_premios').select('*').eq('campanha_id', campRaw.id).order('posicao')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: controlesRaw } = await (supabase as any)
        .from('controle_diario').select('barbeiro_id, servico_id, quantidade').eq('campanha_id', campRaw.id)
      campanha = {
        ...campRaw,
        campanha_servicos: (servicosRaw ?? []) as CampanhaServico[],
        campanha_premios:  (premiosRaw  ?? []) as CampanhaPremio[],
      }
      const servicos = campanha!.campanha_servicos
      for (const cd of ((controlesRaw ?? []) as Pick<ControleDiario, 'barbeiro_id' | 'servico_id' | 'quantidade'>[])) {
        const pts = servicos.find(s => s.id === cd.servico_id)?.pontos ?? 0
        pontosMap[cd.barbeiro_id] = (pontosMap[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
      }
    }
  }

  const rankingPontos = Object.entries(pontosMap)
    .map(([id, pts]) => ({ id, pts }))
    .sort((a, b) => b.pts - a.pts)

  const rankingPontosBarb  = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo !== 'recepcionista')
  const rankingPontosRecep = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo === 'recepcionista')

  const configSlot = (
    <div className="space-y-3">
      <ModoMesSelector modoAtual={modoAtual} mes={mes} ano={ano} />
      <div className="flex flex-col gap-2 px-1">
        <NovoBarbeiroModal />
        <NovoBarbeiroModal tipo="recepcionista" />
        {modoAtual !== 'pontos' && (
          <MetasModal
            barbeiros={barbeiros}
            metasAtuais={metasIndividuais}
            metaColetiva={meta?.meta_coletiva}
            faturamentoAcumulado={meta?.faturamento_acumulado}
            premioColetivo={meta?.premio_coletivo ?? undefined}
            mes={mes}
            ano={ano}
          />
        )}
        {modoAtual !== 'metas' && (
          <CampanhaModal campanha={campanha} mes={mes} ano={ano} />
        )}
        {modoAtual !== 'metas' && campanha && (
          <CampanhaToggle campanhaId={campanha.id} ativo={campanha.ativo} />
        )}
      </div>
    </div>
  )

  const faturamentoEditSlot = meta ? (
    <FaturamentoEdit
      metaId={meta.id}
      faturamentoAtual={meta.faturamento_acumulado ?? 0}
      metaColetiva={meta.meta_coletiva}
      mes={mes}
      ano={ano}
    />
  ) : null

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} configSlot={configSlot} />

      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        {/* Desktop header strip */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-4 border-b border-border">
          <LogoUpload logoUrl={barbearia.logo_url} nomeAbrev={barbearia.nome[0]} />
          <div>
            <p className="text-text font-sans font-semibold text-sm">{barbearia.nome}</p>
            <p className="text-text-muted text-xs font-sans">{nomeMes(mes)} {ano}</p>
          </div>
        </div>

        <DashboardMain
          meta={meta}
          faturamentoExibido={faturamentoExibido}
          progressoColetivo={progressoColetivo}
          rankingBarbeiros={rankingBarbeiros}
          rankingRecepcionistas={rankingRecepcionistas}
          modoAtual={modoAtual}
          campanha={campanha}
          pontosMap={pontosMap}
          rankingPontosBarb={rankingPontosBarb}
          rankingPontosRecep={rankingPontosRecep}
          mes={mes}
          ano={ano}
          diaAtual={diaAtual}
          diasRestantes={diasRestantes}
          diasUteisCorridos={diasUteisCorridos}
          diasUteisRestantes={diasUteisRestantes}
          faturamentoEditSlot={faturamentoEditSlot}
        />
      </div>
    </div>
  )
}
