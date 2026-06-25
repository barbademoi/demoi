import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cicloAtual, cicloDeData } from '@/lib/ciclo'
import LancamentoDiarioClient from './LancamentoDiarioClient'
import Sidebar from '@/components/dashboard/Sidebar'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import type { Barbeiro } from '@/types/database'

import type { ModoMeta, BaseMeta } from '@/lib/modoMeta'
import { valorBase } from '@/lib/modoMeta'

type UsuarioRow = { barbearia_id: string; barbearias: {
  id: string;
  nome: string;
  dia_fechamento: number | null;
  mostrar_faturamento_geral: boolean | null;
  modo_meta: ModoMeta | null;
  base_meta: BaseMeta | null;
} }

export default async function LancamentoDiarioPage({
  searchParams,
}: {
  searchParams?: { mes?: string; ano?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, dia_fechamento, mostrar_faturamento_geral, modo_meta, base_meta)')
    .eq('id', user.id)
    .single()
  const usuario = usuarioRaw as unknown as UsuarioRow | null
  if (!usuario) { redirect('/login') }

  const barbearia = usuario!.barbearias

  const hoje = new Date()
  const diaFechamento = barbearia.dia_fechamento ?? 1
  const mostrarFaturamentoGeral = barbearia.mostrar_faturamento_geral ?? true
  const modoMeta: ModoMeta = barbearia.modo_meta ?? 'faturamento'
  const baseMeta: BaseMeta = valorBase(barbearia.modo_meta, barbearia.base_meta)
  const cicloHoje = cicloAtual(diaFechamento, hoje)
  const mesAtual = cicloHoje.mesRef
  const anoAtual = cicloHoje.anoRef

  // Período selecionado via ?mes=X&ano=Y (default = ciclo atual). Floor 2024-01.
  const mesParam = parseInt(searchParams?.mes ?? '', 10)
  const anoParam = parseInt(searchParams?.ano ?? '', 10)
  let mes = mesAtual
  let ano = anoAtual
  if (Number.isFinite(mesParam) && Number.isFinite(anoParam)
      && mesParam >= 1 && mesParam <= 12 && anoParam >= 2024) {
    mes = mesParam
    ano = anoParam
  }
  const ehPeriodoAtual = mes === mesAtual && ano === anoAtual
  const ehPeriodoPassado = ano < anoAtual || (ano === anoAtual && mes < mesAtual)

  // Ciclo selecionado (datas reais do ciclo desejado).
  const ciclo = ehPeriodoAtual
    ? cicloHoje
    : cicloDeData(new Date(ano, mes - 1, diaFechamento), diaFechamento)

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

  // Barbeiros ativos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('id, nome, foto_url, tipo, ativo')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')
  const barbeiros = (barbeirosRaw ?? []) as Pick<Barbeiro, 'id' | 'nome' | 'foto_url' | 'tipo' | 'ativo'>[]

  // Comandas diárias do CICLO atual (todos os dias, todos os barbeiros)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ldRaw } = await (supabase as any)
    .from('lancamentos_diarios')
    .select('barbeiro_id, data, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .gte('data', ciclo.inicioIso)
    .lte('data', ciclo.fimIso)
    .order('data', { ascending: false })

  const comandasDiarias = (ldRaw ?? []) as { barbeiro_id: string; data: string; numero_atendimentos: number }[]

  // Acumulado do mês
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('faturamento_acumulado, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancMensaisRaw } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada, valor_faturamento, valor_comissao, numero_atendimentos')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const lancPorBarbeiro = (lancMensaisRaw ?? []) as {
    barbeiro_id: string;
    comissao_acumulada: number;
    valor_faturamento: number | null;
    valor_comissao: number | null;
    numero_atendimentos: number;
  }[]
  const acumuladoPorBarbeiro: Record<string, {
    valor_faturamento: number;
    valor_comissao: number;
    atendimentos: number;
  }> = {}
  for (const l of lancPorBarbeiro) {
    // Fallback: se valor_faturamento esta vazio (modo='comissao') ou
    // valor_comissao esta vazio (modo='faturamento'), usa comissao_acumulada
    // como espelho do valor base — assim cards/totais nao mostram 0 enganoso.
    const fat = l.valor_faturamento != null
      ? Number(l.valor_faturamento)
      : (baseMeta === 'faturamento' ? (Number(l.comissao_acumulada) || 0) : 0)
    const com = l.valor_comissao != null
      ? Number(l.valor_comissao)
      : (baseMeta === 'comissao' ? (Number(l.comissao_acumulada) || 0) : 0)
    acumuladoPorBarbeiro[l.barbeiro_id] = {
      valor_faturamento: fat,
      valor_comissao: com,
      atendimentos: Number(l.numero_atendimentos) || 0,
    }
  }

  const totalFaturamentoEquipeMes = Object.values(acumuladoPorBarbeiro).reduce((s, b) => s + b.valor_faturamento, 0)
  const totalComissoesMes = Object.values(acumuladoPorBarbeiro).reduce((s, b) => s + b.valor_comissao, 0)
  const totalAtendimentosMes = lancPorBarbeiro.reduce((s, l) => s + (Number(l.numero_atendimentos) || 0), 0)
  const faturamentoCasaAtual = Number(metaRaw?.faturamento_acumulado) || 0
  const atendimentosCasaAtual = Number(metaRaw?.numero_atendimentos) || 0
  // Card "Faturamento" no topo: total da casa quando o dono lancou,
  // senao a soma do faturamento da equipe (so faz sentido se o modo
  // capturar faturamento). Em modo 'comissao', vai mostrar 0 — esperado.
  const faturamentoMes = faturamentoCasaAtual > 0 ? faturamentoCasaAtual : totalFaturamentoEquipeMes
  // Total de atendimentos exibido: prefere o coletivo da casa; senão a soma por barbeiro
  const atendimentosMesExibido = atendimentosCasaAtual > 0 ? atendimentosCasaAtual : totalAtendimentosMes

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <header>
            <h1 className="font-serif text-2xl sm:text-3xl text-text">Lançamento diário</h1>
            <p className="text-text-muted text-sm font-sans mt-1">
              {ciclo.label}
            </p>
          </header>

          <MonthNavigator
            mesSel={mes}
            anoSel={ano}
            mesAtual={mesAtual}
            anoAtual={anoAtual}
            diaFechamento={diaFechamento}
            podeVoltar={podeVoltar}
            podeAvancar={podeAvancar}
            hrefBase="/dashboard/lancamento-diario"
          />

          {ehPeriodoPassado && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-wrap">
              <p className="text-amber-200 text-xs font-sans leading-relaxed">
                ⚠️ Você está editando <span className="font-semibold capitalize">{ciclo.label}</span>. As alterações afetam o histórico deste período.
              </p>
              <a
                href="/dashboard/lancamento-diario"
                className="text-amber-200 hover:text-amber-100 text-xs font-sans underline whitespace-nowrap shrink-0"
              >
                Voltar ao atual
              </a>
            </div>
          )}

          <LancamentoDiarioClient
            barbeiros={barbeiros}
            comandasDiarias={comandasDiarias}
            acumuladoPorBarbeiro={acumuladoPorBarbeiro}
            faturamentoCasaAtual={faturamentoCasaAtual}
            atendimentosCasaAtual={atendimentosCasaAtual}
            faturamentoMes={faturamentoMes}
            totalFaturamentoEquipeMes={totalFaturamentoEquipeMes}
            totalComissoesMes={totalComissoesMes}
            totalAtendimentosMes={atendimentosMesExibido}
            mes={mes}
            ano={ano}
            cicloInicioIso={ciclo.inicioIso}
            cicloFimIso={ciclo.fimIso}
            diaFechamento={diaFechamento}
            mostrarFaturamentoGeral={mostrarFaturamentoGeral}
            modoMeta={modoMeta}
            baseMeta={baseMeta}
          />
        </main>
      </div>
    </div>
  )
}
