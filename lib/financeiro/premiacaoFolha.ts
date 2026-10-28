/**
 * PREMIAÇÃO COMO ADICIONAL NA FOLHA — quando criar, quando atualizar, quando
 * parar de mexer.
 *
 * O valor vem pronto de `buscarPremiacaoBarbermeta`, que reutiliza o mesmo
 * carregamento do bloco "Premiação do mês" do dashboard. Aqui não se calcula
 * prêmio nenhum: decide-se o que fazer com a linha na folha.
 *
 * ── A LINHA TEM DONO, E NÃO É O SISTEMA ─────────────────────────────────────
 * A regra propõe; o dono decide. Três decisões dele são definitivas e o
 * automático nunca as desfaz:
 *   - REMOVEU  → `premiacaoRemovida[mês]` fica gravado e a linha não renasce.
 *     Sem essa memória, apagar a linha seria inútil: ela voltaria no próximo
 *     carregamento da tela.
 *   - EDITOU   → o valor dele manda. A regra continua visível ao lado, como
 *     referência, pra ele saber do que está discordando.
 *   - JÁ PAGOU → folha paga não se mexe. É o que protege as folhas fechadas
 *     antes desta mudança existir: elas simplesmente não recebem linha.
 *
 * ── PREVISTO x FINAL ────────────────────────────────────────────────────────
 * Ciclo ABERTO: a linha é previsão e acompanha o valor sozinha — o prêmio
 * ainda pode subir ou cair até o fim do mês.
 * Ciclo FECHADO: o valor TRAVA. Se um lançamento antigo for editado depois e a
 * regra mudar, a folha NÃO se corrige sozinha: ela mostra a divergência e
 * espera o dono. Recalcular em silêncio mudaria um pagamento já combinado.
 */

export const TIPO_PREMIACAO = 'Premiação do ciclo'

/** Tipos que o dono usa pra lançar premiação À MÃO — o risco de duplicidade. */
export const TIPOS_PREMIACAO_MANUAL = ['Meta batida', 'Gincana']

export interface LinhaPremiacao {
  id: string
  tipo: string
  valor: number
  obs?: string
  /** Marca a linha como criada pela regra. Bônus manual não tem. */
  origem?: 'premiacao'
  /** O que a regra dizia quando a linha foi gravada/atualizada. */
  valorRegra?: number
  /** Rótulo do ciclo ("outubro 2026" ou "26 out — 25 nov"). */
  ciclo?: string
  composicao?: string
  /** Ciclo ainda aberto: valor é previsão e se atualiza sozinho. */
  previsto?: boolean
  /** Ciclo fechado: valor congelado, não se atualiza mais sozinho. */
  travado?: boolean
  /** O dono mudou o valor à mão. */
  editado?: boolean
}

export interface RegraPremiacao {
  total: number
  composicao: string
  ciclo: string
}

/** A linha automática daquele mês, se existir. */
export function linhaAutomatica(bonus: LinhaPremiacao[] | undefined): LinhaPremiacao | null {
  return (bonus || []).find((b) => b.origem === 'premiacao') ?? null
}

/** Bônus de premiação lançados à mão — o que não pode ser somado em dobro. */
export function premiacaoManual(bonus: LinhaPremiacao[] | undefined): LinhaPremiacao[] {
  return (bonus || []).filter((b) => b.origem !== 'premiacao' && TIPOS_PREMIACAO_MANUAL.includes(b.tipo))
}

export type Acao =
  /** Nada a fazer. */
  | { tipo: 'nada'; motivo: string }
  /** Criar a linha com estes campos. */
  | { tipo: 'criar'; linha: Omit<LinhaPremiacao, 'id'> }
  /** Atualizar a linha existente (previsão acompanhando a regra, ou travar). */
  | { tipo: 'atualizar'; patch: Partial<LinhaPremiacao> }

export interface Contexto {
  /** Linha automática já existente no mês, se houver. */
  atual: LinhaPremiacao | null
  /** O dono removeu a linha deste mês. */
  removida: boolean
  /** A folha deste mês já foi paga. */
  paga: boolean
  /** Ciclo fechado pelo dono. */
  fechado: boolean
  /** Existe bônus de premiação lançado à mão neste mês. */
  temManual: boolean
  /** O que a regra diz agora. null = barbeiro sem prêmio, ou sem premiação. */
  regra: RegraPremiacao | null
}

export function decidir(ctx: Contexto): Acao {
  // Folha paga é histórico. Nem cria, nem atualiza, nem trava — é isto que
  // deixa intactas as folhas fechadas antes desta mudança.
  if (ctx.paga) return { tipo: 'nada', motivo: 'folha já paga' }

  if (!ctx.atual) {
    if (ctx.removida) return { tipo: 'nada', motivo: 'o dono removeu esta linha' }
    if (!ctx.regra || ctx.regra.total <= 0) return { tipo: 'nada', motivo: 'sem premiação no ciclo' }
    // Já existe prêmio lançado à mão: criar a linha automática pagaria duas
    // vezes. A tela avisa e o dono resolve qual das duas fica.
    if (ctx.temManual) return { tipo: 'nada', motivo: 'já existe premiação lançada à mão' }
    return {
      tipo: 'criar',
      linha: {
        tipo: TIPO_PREMIACAO,
        valor: ctx.regra.total,
        valorRegra: ctx.regra.total,
        composicao: ctx.regra.composicao,
        ciclo: ctx.regra.ciclo,
        origem: 'premiacao',
        previsto: !ctx.fechado,
        travado: ctx.fechado,
        obs: ctx.regra.composicao,
      },
    }
  }

  const atual = ctx.atual
  const totalRegra = ctx.regra?.total ?? 0

  // Travada: o valor é final. Mesmo que a regra mude (lançamento antigo
  // editado), NÃO se corrige sozinha — a tela mostra a divergência.
  if (atual.travado) return { tipo: 'nada', motivo: 'valor final, travado no fechamento' }

  // O dono mandou um valor. A regra vira referência, não ordem.
  if (atual.editado) {
    // Só atualiza a referência, pra ele ver do que está discordando agora.
    if (atual.valorRegra !== totalRegra) {
      return { tipo: 'atualizar', patch: { valorRegra: totalRegra, composicao: ctx.regra?.composicao ?? '' } }
    }
    return { tipo: 'nada', motivo: 'ajustado manualmente' }
  }

  // Ciclo fechou agora: congela o valor final.
  if (ctx.fechado) {
    return {
      tipo: 'atualizar',
      patch: {
        valor: totalRegra,
        valorRegra: totalRegra,
        composicao: ctx.regra?.composicao ?? '',
        previsto: false,
        travado: true,
      },
    }
  }

  // Ciclo aberto: a previsão acompanha.
  if (atual.valor !== totalRegra || atual.valorRegra !== totalRegra) {
    return {
      tipo: 'atualizar',
      patch: {
        valor: totalRegra,
        valorRegra: totalRegra,
        composicao: ctx.regra?.composicao ?? '',
        obs: ctx.regra?.composicao ?? '',
        previsto: true,
      },
    }
  }

  return { tipo: 'nada', motivo: 'já está igual à regra' }
}

/**
 * Divergência: linha travada cujo valor final não bate mais com a regra.
 * Acontece quando um lançamento do ciclo é editado depois do fechamento.
 */
export function divergencia(linha: LinhaPremiacao | null, regra: RegraPremiacao | null): number | null {
  if (!linha || !linha.travado || linha.editado) return null
  const totalRegra = regra?.total ?? 0
  if (Math.abs((linha.valorRegra ?? linha.valor) - totalRegra) < 0.005) return null
  return totalRegra
}

/** Rótulo curto do estado, pro selo ao lado do valor. */
export function selo(linha: LinhaPremiacao): string | null {
  if (linha.editado) return 'ajustado manualmente'
  if (linha.travado) return 'valor final'
  if (linha.previsto) return 'previsto'
  return null
}
