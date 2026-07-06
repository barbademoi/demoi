import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RelatorioPontosView from '@/components/dashboard/RelatorioPontosView'
import AutoPrint from './AutoPrint'
import { cicloAtual, cicloDeData, hojeBrasil } from '@/lib/ciclo'
import { gerarRelatorioPontos } from '@/lib/relatorioPontos'

export const dynamic = 'force-dynamic'

// Versão de impressão (Salvar como PDF). Standalone, sem menu — só o dono,
// mesma fonte de dados da tela, então o PDF bate com o ranking e com a tela.
export default async function RelatorioPontosPrintPage({
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

  const relatorio = await gerarRelatorioPontos(supabase, barbearia.id, ciclo.inicioIso, ciclo.fimIso)
  const emitidoEm = hoje.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-background print-exact">
      {/* Força impressão das cores (fundo escuro + acentos), no padrão do app. */}
      <style>{`
        @media print {
          @page { margin: 12mm; }
          html, body { background: #08090D !important; }
          .print-exact, .print-exact * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <AutoPrint />

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Cabeçalho — identidade BarberMeta + período */}
        <header className="text-center border-b border-border pb-5">
          <h1 className="font-serif text-3xl text-text">Barber<span className="metal-text-gold">Meta</span></h1>
          <p className="text-text text-base font-sans mt-2 font-semibold">Conferência de pontos</p>
          <p className="text-text-muted text-sm font-sans capitalize">{barbearia.nome} · {ciclo.label}</p>
          <p className="text-text-muted text-xs font-sans mt-1">Emitido em {emitidoEm}</p>
        </header>

        <RelatorioPontosView relatorio={relatorio} />

        <p className="text-text-muted text-[11px] font-sans text-center pt-2">
          Os totais deste relatório usam os mesmos lançamentos do ranking da campanha.
        </p>
      </div>
    </div>
  )
}
