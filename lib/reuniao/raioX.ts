/**
 * RAIO-X DA REUNIÃO — panorama automático da equipe pro dono, montado pelo
 * sistema (o dono não calcula nada). SÓ LEITURA.
 *
 * FONTE ÚNICA (mesma do ranking/dashboard, sem caminho paralelo):
 *  - Valor por barbeiro (comissão/faturamento) = lancamentos.comissao_acumulada
 *    do ciclo — a mesma chave do ranking. Rótulo segue base_meta.
 *  - Pontos = gerarRelatorioPontos (controle_diario × campanha_servicos.pontos)
 *    — idêntico ao ranking de pontos.
 *  - Projeção/ritmo = calcularRitmo() com os dias trabalhados do barbeiro
 *    (resolverDiasTrabalho), a mesma régua já usada na tela do barbeiro/IA.
 *  - Destaques = calcularDestaquesMes() (o mesmo widget do dashboard).
 *
 * COMPARAÇÃO "MESMO PERÍODO DO MÊS PASSADO" (mesmos dias decorridos, NÃO o mês
 * inteiro): como o R$ é guardado só no acumulado do mês, o ciclo anterior é
 * prorrateado à mesma fração de dias decorridos — exatamente o método já usado
 * em destaquesMes. Fuso America/Sao_Paulo.
 */
import { cicloAtual, cicloDeData, hojeBrasil, calcDiasUteisCiclo } from './../ciclo'
import { calcularRitmo, resolverDiasTrabalho } from './../ritmo'
import { gerarRelatorioPontos } from './../relatorioPontos'
import { calcularDestaquesMes, type DestaquesMes } from './../destaquesMes'
import { buscarHistoricoBarbearia } from './../historicoMeses'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export interface BarbeiroRaioX {
  barbeiroId: string
  nome: string
  valorAtual: number                  // acumulado do ciclo (base da meta) — ranking
  valorMesmoPeriodoAnterior: number   // ciclo anterior prorrateado aos mesmos dias
  deltaPct: number | null             // null = sem base anterior pra comparar
  pontos: number                      // pontos do ciclo (ranking)
  metaFoco: number                    // próximo tier individual não batido (0 = sem)
  projetado: number                   // previsão de fechamento (ritmo × dias)
  esperadoAteHoje: number
  ritmoOk: boolean
  usaDiasTrabalho: boolean
  precisaAtencao: boolean
  motivoAtencao: string | null
}

export interface FaturamentoGeralMes {
  label: string
  valor: number
  deltaPct: number | null   // variação vs. o mês anterior (null = sem base)
  emAndamento: boolean       // true no ciclo atual (parcial, ainda em curso)
}

export interface RaioXReuniao {
  cicloLabel: string
  cicloAnteriorLabel: string
  diasDecorridos: number
  totalDiasCiclo: number
  baseLabel: string                   // "Faturamento" | "Comissão"
  totalAtual: number
  totalMesmoPeriodoAnterior: number
  totalDeltaPct: number | null
  totalProjetado: number
  barbeiros: BarbeiroRaioX[]
  precisamAtencao: BarbeiroRaioX[]
  destaques: DestaquesMes
  // Resumo do FATURAMENTO GERAL da casa (últimos 6 meses). Só quando o toggle
  // "Mostrar faturamento geral" está ligado — senão vem null (não exibir).
  mostrarFaturamentoGeral: boolean
  faturamentoGeral: FaturamentoGeralMes[] | null
}

function diasDecorridosInclusive(inicio: Date, hoje: Date): number {
  const a = new Date(inicio); a.setHours(0, 0, 0, 0)
  const b = new Date(hoje); b.setHours(0, 0, 0, 0)
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1
}

function pctCrescimento(atual: number, anterior: number): number | null {
  if (anterior <= 0) return null
  return ((atual - anterior) / anterior) * 100
}

export async function gerarRaioXReuniao(
  supabase: SupabaseLike,
  barbeariaId: string,
): Promise<RaioXReuniao> {
  // Config: ciclo + base da meta (rótulo) + dias de trabalho padrão da barbearia.
  const { data: cfg } = await supabase
    .from('barbearias')
    .select('dia_fechamento, modo_meta, base_meta, dias_trabalho_padrao, mostrar_faturamento_geral')
    .eq('id', barbeariaId)
    .single()
  const diaFechamento = (cfg?.dia_fechamento as number | null) ?? 1
  const modoMeta = (cfg?.modo_meta ?? 'comissao') as 'faturamento' | 'comissao' | 'ambos'
  const baseMeta = (cfg?.base_meta ?? 'comissao') as 'faturamento' | 'comissao'
  const base = modoMeta === 'ambos' ? baseMeta : (modoMeta as 'faturamento' | 'comissao')
  const baseLabel = base === 'faturamento' ? 'Faturamento' : 'Comissão'
  const padraoBarbearia = (cfg?.dias_trabalho_padrao as number | null) ?? null
  // Respeita o toggle das configs: default true (mesma regra do dashboard).
  const mostrarFaturamentoGeral = (cfg?.mostrar_faturamento_geral ?? true) as boolean

  const hoje = hojeBrasil()
  const ciclo = cicloAtual(diaFechamento, hoje)
  const antes = new Date(ciclo.inicio); antes.setDate(antes.getDate() - 1)
  const cicloAnterior = cicloDeData(antes, diaFechamento)
  const totalDiasCiclo = ciclo.totalDias
  const diasDecorridos = Math.min(totalDiasCiclo, Math.max(1, diasDecorridosInclusive(ciclo.inicio, hoje)))
  const fator = Math.min(1, diasDecorridos / cicloAnterior.totalDias)
  const { diasUteisCorridos, diasUteisRestantes } = calcDiasUteisCiclo(ciclo.inicio, ciclo.fim, hoje)

  // ── Resumo do FATURAMENTO GERAL da casa (últimos 6 meses) ──
  // Reutiliza buscarHistoricoBarbearia (mesma fonte do dashboard: soma de
  // lancamentos.comissao_acumulada, ou metas.faturamento_acumulado quando o
  // dono preencheu). Só monta se o toggle "Mostrar faturamento geral" estiver
  // ligado — coerente com a regra que já existe no resto do sistema.
  let faturamentoGeral: FaturamentoGeralMes[] | null = null
  if (mostrarFaturamentoGeral) {
    const hist = await buscarHistoricoBarbearia(supabase, barbeariaId, ciclo.mesRef, ciclo.anoRef, 6, diaFechamento)
    faturamentoGeral = hist.map((h, i) => {
      const anterior = i > 0 ? hist[i - 1].comissao : null
      const emAndamento = h.mes === ciclo.mesRef && h.ano === ciclo.anoRef
      // MÊS EM ANDAMENTO: compara o período decorrido contra o MESMO período
      // do mês anterior — mesma lógica do "Panorama da equipe" (prorrateia o
      // mês anterior pela fração de dias decorridos, `fator`), NÃO contra o
      // mês fechado inteiro. Meses já fechados comparam full vs full.
      const baseAnterior = anterior != null && emAndamento ? anterior * fator : anterior
      const deltaPct = baseAnterior != null && baseAnterior > 0
        ? ((h.comissao - baseAnterior) / baseAnterior) * 100
        : null
      return {
        label: h.label,
        valor: h.comissao,
        deltaPct,
        emAndamento,
      }
    })
  }

  const vazio: RaioXReuniao = {
    cicloLabel: ciclo.label,
    cicloAnteriorLabel: cicloAnterior.label,
    diasDecorridos, totalDiasCiclo, baseLabel,
    totalAtual: 0, totalMesmoPeriodoAnterior: 0, totalDeltaPct: null, totalProjetado: 0,
    barbeiros: [], precisamAtencao: [],
    destaques: { pontuacao: null, faturamento: null, faturamentoLabel: `Maior ${baseLabel.toLowerCase()}`, evolucao: null },
    mostrarFaturamentoGeral, faturamentoGeral,
  }

  // Barbeiros ativos (exclui recepcionista do panorama de R$; pontos entram à parte).
  const { data: barbRaw } = await supabase
    .from('barbeiros').select('id, nome, tipo, dias_trabalho_mes')
    .eq('barbearia_id', barbeariaId).eq('ativo', true)
  const barbeiros = ((barbRaw ?? []) as { id: string; nome: string; tipo: string; dias_trabalho_mes: number | null }[])
    .filter(b => b.tipo !== 'recepcionista')
  if (barbeiros.length === 0) return vazio

  // Acumulado do ciclo atual + ciclo anterior (mesma chave do ranking).
  const [{ data: atualRaw }, { data: prevRaw }, meta, destaques, rel] = await Promise.all([
    supabase.from('lancamentos').select('barbeiro_id, comissao_acumulada')
      .eq('barbearia_id', barbeariaId).eq('mes', ciclo.mesRef).eq('ano', ciclo.anoRef),
    supabase.from('lancamentos').select('barbeiro_id, comissao_acumulada')
      .eq('barbearia_id', barbeariaId).eq('mes', cicloAnterior.mesRef).eq('ano', cicloAnterior.anoRef),
    supabase.from('metas').select('id')
      .eq('barbearia_id', barbeariaId).eq('mes', ciclo.mesRef).eq('ano', ciclo.anoRef).maybeSingle(),
    calcularDestaquesMes(supabase, barbeariaId),
    gerarRelatorioPontos(supabase, barbeariaId, ciclo.inicioIso, ciclo.fimIso),
  ])

  const atualMap = new Map<string, number>()
  for (const r of (atualRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    atualMap.set(r.barbeiro_id, Number(r.comissao_acumulada) || 0)
  }
  const prevMap = new Map<string, number>()
  for (const r of (prevRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    prevMap.set(r.barbeiro_id, Number(r.comissao_acumulada) || 0)
  }
  const pontosMap = new Map<string, number>()
  for (const b of (rel?.barbeiros ?? []) as { barbeiroId: string; subtotal: number }[]) {
    pontosMap.set(b.barbeiroId, b.subtotal)
  }

  // Metas individuais do ciclo (tiers) → próximo tier não batido = metaFoco.
  const metaId = (meta?.data ?? meta)?.id as string | undefined
  const metaTiers = new Map<string, number[]>()
  if (metaId) {
    const { data: miRaw } = await supabase
      .from('metas_individuais').select('barbeiro_id, bronze_comm, prata_comm, ouro_comm')
      .eq('meta_id', metaId)
    for (const m of (miRaw ?? []) as { barbeiro_id: string; bronze_comm: number; prata_comm: number; ouro_comm: number }[]) {
      metaTiers.set(m.barbeiro_id, [Number(m.bronze_comm) || 0, Number(m.prata_comm) || 0, Number(m.ouro_comm) || 0])
    }
  }

  const linhas: BarbeiroRaioX[] = barbeiros.map(b => {
    const valorAtual = atualMap.get(b.id) ?? 0
    const prevProporcional = (prevMap.get(b.id) ?? 0) * fator
    const deltaPct = pctCrescimento(valorAtual, prevProporcional)

    const tiers = (metaTiers.get(b.id) ?? []).filter(v => v > 0).sort((x, y) => x - y)
    const metaFoco = tiers.find(v => v > valorAtual) ?? 0

    const ritmo = calcularRitmo({
      comissao: valorAtual,
      metaFoco,
      diasCorridosCiclo: diasDecorridos,
      totalDiasCiclo,
      diasTrabalhoMes: resolverDiasTrabalho(b.dias_trabalho_mes, padraoBarbearia),
      diasUteisCorridos,
      diasUteisRestantes,
    })

    // Precisa de atenção: caiu vs mesmo período do mês passado, OU está atrás
    // do ritmo pra bater a meta foco (projeção não alcança a meta).
    const caiu = deltaPct != null && deltaPct < 0
    const atrasRitmo = metaFoco > 0 && !ritmo.ritmoOk && ritmo.projetado < metaFoco
    let motivoAtencao: string | null = null
    if (caiu && atrasRitmo) motivoAtencao = `Caiu ${Math.abs(Math.round(deltaPct!))}% vs. mesmo período e atrás do ritmo`
    else if (caiu) motivoAtencao = `Caiu ${Math.abs(Math.round(deltaPct!))}% vs. mesmo período do mês passado`
    else if (atrasRitmo) motivoAtencao = 'Atrás do ritmo pra bater a meta'

    return {
      barbeiroId: b.id,
      nome: b.nome,
      valorAtual,
      valorMesmoPeriodoAnterior: prevProporcional,
      deltaPct,
      pontos: pontosMap.get(b.id) ?? 0,
      metaFoco,
      projetado: ritmo.projetado,
      esperadoAteHoje: ritmo.esperadoAteHoje,
      ritmoOk: ritmo.ritmoOk,
      usaDiasTrabalho: ritmo.usaDiasTrabalho,
      precisaAtencao: caiu || atrasRitmo,
      motivoAtencao,
    }
  }).sort((a, b) => b.valorAtual - a.valorAtual || a.nome.localeCompare(b.nome, 'pt-BR'))

  const totalAtual = linhas.reduce((s, l) => s + l.valorAtual, 0)
  const totalMesmoPeriodoAnterior = linhas.reduce((s, l) => s + l.valorMesmoPeriodoAnterior, 0)
  const totalProjetado = linhas.reduce((s, l) => s + l.projetado, 0)
  const precisamAtencao = linhas
    .filter(l => l.precisaAtencao)
    .sort((a, b) => (a.deltaPct ?? 0) - (b.deltaPct ?? 0))

  return {
    cicloLabel: ciclo.label,
    cicloAnteriorLabel: cicloAnterior.label,
    diasDecorridos, totalDiasCiclo, baseLabel,
    totalAtual,
    totalMesmoPeriodoAnterior,
    totalDeltaPct: pctCrescimento(totalAtual, totalMesmoPeriodoAnterior),
    totalProjetado,
    barbeiros: linhas,
    precisamAtencao,
    destaques,
    mostrarFaturamentoGeral, faturamentoGeral,
  }
}
