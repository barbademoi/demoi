/**
 * "Destaques do mês" — 3 destaques da equipe no CICLO ATUAL, só pro dono.
 *
 * FONTE ÚNICA (mesma do ranking, sem caminho paralelo):
 *  - Pontuação: pontos do ciclo via gerarRelatorioPontos (controle_diario ×
 *    campanha_servicos.pontos) — idêntico ao ranking de pontos.
 *  - Faturamento: lancamentos.comissao_acumulada por barbeiro (a mesma chave
 *    que alimenta o ranking/histórico). Rótulo depende de base_meta.
 *  - Evolução: crescimento % do faturamento no ciclo atual (até hoje) vs o
 *    MESMO PERÍODO do ciclo anterior. Como o R$ é guardado só no ACUMULADO do
 *    mês (não há R$ por dia), o ciclo anterior é PRORROGADO à mesma proporção
 *    de dias decorridos — NUNCA o mês inteiro. Assim a comparação é justa.
 *
 * Só leitura. Não altera lançamentos, metas nem ranking. Fuso America/Sao_Paulo.
 */
import { formatBRL } from './utils'
import { cicloAtual, cicloDeData, hojeBrasil } from './ciclo'
import { gerarRelatorioPontos } from './relatorioPontos'

export interface Destaque {
  nome: string
  valorFmt: string
  empatadoCom: string | null   // nome do 2º empatado, se houver
}
export interface DestaqueEvolucao extends Destaque {
  crescimentoPct: number
}
export interface DestaquesMes {
  pontuacao: Destaque | null
  faturamento: Destaque | null
  faturamentoLabel: string          // "Maior faturamento" | "Maior comissão"
  evolucao: DestaqueEvolucao | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

function diasDecorridosInclusive(inicio: Date, hoje: Date): number {
  const a = new Date(inicio); a.setHours(0, 0, 0, 0)
  const b = new Date(hoje); b.setHours(0, 0, 0, 0)
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1
}

// Escolhe o maior de um mapa (id → valor > 0), desempate alfabético.
function maiorPositivo(
  valores: Array<{ id: string; nome: string; valor: number }>,
): { nome: string; valor: number; empatadoCom: string | null } | null {
  const positivos = valores.filter(v => v.valor > 0)
  if (positivos.length === 0) return null
  const max = Math.max(...positivos.map(v => v.valor))
  const empatados = positivos
    .filter(v => v.valor === max)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return {
    nome: empatados[0].nome,
    valor: max,
    empatadoCom: empatados.length > 1 ? empatados[1].nome : null,
  }
}

export async function calcularDestaquesMes(
  supabase: SupabaseLike,
  barbeariaId: string,
): Promise<DestaquesMes> {
  const vazio: DestaquesMes = { pontuacao: null, faturamento: null, faturamentoLabel: 'Maior faturamento', evolucao: null }

  // Config da barbearia (dia de fechamento, base da meta pro rótulo, piso da evolução).
  const { data: cfg } = await supabase
    .from('barbearias')
    .select('dia_fechamento, modo_meta, base_meta, evolucao_faturamento_minimo')
    .eq('id', barbeariaId)
    .single()
  const diaFechamento = (cfg?.dia_fechamento as number | null) ?? 1
  const modoMeta = (cfg?.modo_meta ?? 'comissao') as 'faturamento' | 'comissao' | 'ambos'
  const baseMeta = (cfg?.base_meta ?? 'comissao') as 'faturamento' | 'comissao'
  // Piso mínimo de faturamento no ciclo anterior pra concorrer à evolução.
  const pisoEvolucao = cfg?.evolucao_faturamento_minimo != null
    ? Number(cfg.evolucao_faturamento_minimo) || 0
    : 500
  const base = modoMeta === 'ambos' ? baseMeta : (modoMeta as 'faturamento' | 'comissao')
  const faturamentoLabel = base === 'faturamento' ? 'Maior faturamento' : 'Maior comissão'

  const hoje = hojeBrasil()
  const ciclo = cicloAtual(diaFechamento, hoje)
  // Ciclo anterior: um dia antes do início do ciclo atual.
  const antes = new Date(ciclo.inicio); antes.setDate(antes.getDate() - 1)
  const cicloAnterior = cicloDeData(antes, diaFechamento)
  const diasDecorridos = Math.min(ciclo.totalDias, Math.max(1, diasDecorridosInclusive(ciclo.inicio, hoje)))

  // Barbeiros ativos (nome).
  const { data: barbRaw } = await supabase
    .from('barbeiros').select('id, nome').eq('barbearia_id', barbeariaId).eq('ativo', true)
  const nomeById = new Map<string, string>()
  for (const b of (barbRaw ?? []) as { id: string; nome: string }[]) nomeById.set(b.id, b.nome)
  if (nomeById.size === 0) return { ...vazio, faturamentoLabel }

  // ── Pontuação (mesma fonte do ranking de pontos) ──
  const rel = await gerarRelatorioPontos(supabase, barbeariaId, ciclo.inicioIso, ciclo.fimIso)
  const pontosArr = rel.barbeiros
    .filter(b => nomeById.has(b.barbeiroId))
    .map(b => ({ id: b.barbeiroId, nome: nomeById.get(b.barbeiroId)!, valor: b.subtotal }))
  const topPontos = maiorPositivo(pontosArr)

  // ── Faturamento atual + ciclo anterior (lancamentos.comissao_acumulada) ──
  const [{ data: atualRaw }, { data: prevRaw }] = await Promise.all([
    supabase.from('lancamentos').select('barbeiro_id, comissao_acumulada')
      .eq('barbearia_id', barbeariaId).eq('mes', ciclo.mesRef).eq('ano', ciclo.anoRef),
    supabase.from('lancamentos').select('barbeiro_id, comissao_acumulada')
      .eq('barbearia_id', barbeariaId).eq('mes', cicloAnterior.mesRef).eq('ano', cicloAnterior.anoRef),
  ])
  const atualMap = new Map<string, number>()
  for (const r of (atualRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    atualMap.set(r.barbeiro_id, Number(r.comissao_acumulada) || 0)
  }
  const prevMap = new Map<string, number>()
  for (const r of (prevRaw ?? []) as { barbeiro_id: string; comissao_acumulada: number }[]) {
    prevMap.set(r.barbeiro_id, Number(r.comissao_acumulada) || 0)
  }

  const fatArr = Array.from(nomeById.entries())
    .map(([id, nome]) => ({ id, nome, valor: atualMap.get(id) ?? 0 }))
  const topFat = maiorPositivo(fatArr)

  // ── Evolução: crescimento % vs MESMO PERÍODO do ciclo anterior (prorrateado
  //    à mesma proporção de dias decorridos — nunca o mês inteiro). ──
  const fator = Math.min(1, diasDecorridos / cicloAnterior.totalDias)
  const evolCandidatos = Array.from(nomeById.entries())
    .map(([id, nome]) => {
      const atual = atualMap.get(id) ?? 0
      const prevCheio = prevMap.get(id) ?? 0
      // PISO: só concorre quem faturou acima do mínimo no ciclo anterior.
      // Combina com a regra de ter dado anterior (prevCheio > 0). Evita %
      // gigante vindo de base pequena (ex.: R$ 50 → R$ 2.000).
      if (prevCheio < pisoEvolucao || prevCheio <= 0) return null
      const prevProporcional = prevCheio * fator
      if (prevProporcional <= 0) return null
      const crescimento = ((atual - prevProporcional) / prevProporcional) * 100
      return { id, nome, crescimento }
    })
    .filter((x): x is { id: string; nome: string; crescimento: number } => x !== null)

  let evolucao: DestaqueEvolucao | null = null
  if (evolCandidatos.length > 0) {
    const maxCresc = Math.max(...evolCandidatos.map(c => c.crescimento))
    // Só celebra crescimento POSITIVO. Se ninguém cresceu, mostra estado vazio.
    if (maxCresc > 0) {
      const empatados = evolCandidatos
        .filter(c => c.crescimento === maxCresc)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      evolucao = {
        nome: empatados[0].nome,
        crescimentoPct: maxCresc,
        valorFmt: `+${Math.round(maxCresc)}%`,
        empatadoCom: empatados.length > 1 ? empatados[1].nome : null,
      }
    }
  }

  return {
    pontuacao: topPontos
      ? { nome: topPontos.nome, valorFmt: `${topPontos.valor} pts`, empatadoCom: topPontos.empatadoCom }
      : null,
    faturamento: topFat
      ? { nome: topFat.nome, valorFmt: formatBRL(topFat.valor), empatadoCom: topFat.empatadoCom }
      : null,
    faturamentoLabel,
    evolucao,
  }
}
