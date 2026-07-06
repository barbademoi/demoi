import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import RelatorioPontosView from '@/components/dashboard/RelatorioPontosView'
import BaixarPdfButton from './BaixarPdfButton'
import { cicloAtual, cicloDeData, hojeBrasil } from '@/lib/ciclo'
import { gerarRelatorioPontos } from '@/lib/relatorioPontos'

export const dynamic = 'force-dynamic'

// Relatório de conferência da campanha de pontos — SÓ o dono. A auth exige
// sessão; os dados são escopados pela barbearia do dono (RLS/filtro).
export default async function RelatorioPontosPage({
  searchParams,
}: { searchParams?: { mes?: string; ano?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, dia_fechamento)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string; dia_fechamento: number | null } } | null }
  if (!usuario?.barbearias) redirect('/login')
  const barbearia = usuario.barbearias

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

  const relatorio = await gerarRelatorioPontos(supabase, barbearia.id, ciclo.inicioIso, ciclo.fimIso)

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl text-text">Conferência de pontos</h1>
              <p className="text-text-muted text-sm font-sans mt-0.5 leading-relaxed">
                De onde vieram os pontos da campanha no período. Os totais batem com o ranking.
              </p>
            </div>
            <BaixarPdfButton mes={mes} ano={ano} />
          </div>

          <MonthNavigator
            mesSel={mes}
            anoSel={ano}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            diaFechamento={diaFechamento}
            podeVoltar={podeVoltar}
            podeAvancar={podeAvancar}
            hrefBase="/dashboard/relatorio-pontos"
          />

          <RelatorioPontosView relatorio={relatorio} />
        </main>
      </div>
    </div>
  )
}
