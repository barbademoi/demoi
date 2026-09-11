/**
 * PARCELAS DAS CONTAS A PAGAR/RECEBER — escopo de exclusão e de edição.
 *
 * ── COMO AS PARCELAS EXISTEM (investigado antes de escrever isto) ───────────
 * Não existe uma linha por parcela. Uma conta parcelada ou fixa é UM ÚNICO
 * registro, com `recurrence` ('once' | 'fixed' | 'installments'), `startMonth`
 * e `installments`. As parcelas são PROJEÇÃO: `apareceNoMes()` decide, mês a
 * mês, se aquele registro se mostra. O que é por mês é só o pagamento, em
 * `done['YYYY-MM']`.
 *
 * Isso tem duas consequências que definem todo este arquivo:
 *
 *   1. "Excluir todas" já era o comportamento do botão ✕ — ele apagava o
 *      registro, e com ele as parcelas passadas JÁ PAGAS. Silenciosamente.
 *   2. "Excluir só esta parcela" não existia e não tinha como existir: não há
 *      linha pra apagar. Precisa de uma EXCEÇÃO por mês (`skip`).
 *
 * ── O QUE FOI ACRESCENTADO AO REGISTRO ──────────────────────────────────────
 *   `skip:      { 'YYYY-MM': true }`      — parcela removida individualmente
 *   `endMonth:  'YYYY-MM' | null`         — série encerrada a partir do mês seguinte
 *   `overrides: { 'YYYY-MM': {...} }`     — parcela editada individualmente
 *
 * Tudo opcional: registro antigo sem esses campos se comporta como antes.
 *
 * ── A REGRA QUE MANDA EM TUDO ───────────────────────────────────────────────
 * NENHUMA operação em massa altera parcela JÁ PAGA. Não é uma checagem no fim:
 * é o que decide a forma de cada operação. Excluir "todas" não apaga o
 * registro quando há mês pago — encerra a série depois do último pago. Editar
 * "esta e as futuras" não reescreve o registro — corta em dois, e ainda fixa o
 * valor antigo dos meses pagos que caírem no pedaço novo.
 *
 * Fuso: mês é 'YYYY-MM' já resolvido em America/Sao_Paulo por quem chama.
 */

export type Recorrencia = 'once' | 'fixed' | 'installments'

export interface Conta {
  id: string
  description: string
  amount: number
  recurrence: Recorrencia
  installments?: number
  startMonth: string
  endMonth?: string | null
  dueDay?: number | null
  dueDate?: string
  done?: Record<string, unknown>
  skip?: Record<string, boolean>
  overrides?: Record<string, Partial<Pick<Conta, 'amount' | 'description' | 'dueDay'>>>
  // O registro carrega outros campos (scope, destAccount…) que não interessam
  // a estas regras e precisam atravessar intactos.
  [k: string]: unknown
}

const pad = (n: number) => String(n).padStart(2, '0')

export function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const idx = y * 12 + (m - 1) + delta
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`
}

export function monthDiff(a: string, b: string): number {
  const [ya, ma] = a.split('-').map(Number)
  const [yb, mb] = b.split('-').map(Number)
  return (ya * 12 + ma) - (yb * 12 + mb)
}

/** A conta se mostra neste mês? Única definição — a tela e os totais usam esta. */
export function apareceNoMes(b: Conta, ym: string): boolean {
  if (b.skip && b.skip[ym]) return false
  if (b.endMonth && ym > b.endMonth) return false
  if (b.recurrence === 'fixed') return ym >= b.startMonth
  if (b.recurrence === 'installments') {
    const d = monthDiff(ym, b.startMonth)
    return d >= 0 && d < (b.installments || 1)
  }
  return b.startMonth === ym
}

export const estaPaga = (b: Conta, ym: string): boolean => !!(b.done && b.done[ym])

/** Valor da conta NAQUELE mês — a edição de uma parcela só vive aqui. */
export function valorNoMes(b: Conta, ym: string): number {
  const ov = b.overrides && b.overrides[ym]
  const v = ov && ov.amount != null ? ov.amount : b.amount
  return Number(v) || 0
}

export function descricaoNoMes(b: Conta, ym: string): string {
  const ov = b.overrides && b.overrides[ym]
  return (ov && ov.description) || b.description
}

export function diaVencimentoNoMes(b: Conta, ym: string): number | null {
  const ov = b.overrides && b.overrides[ym]
  if (ov && ov.dueDay != null) return ov.dueDay
  return b.dueDay ?? null
}

/** Parcelada ou fixa — só nestas a pergunta de escopo faz sentido. */
export const ehSerie = (b: Conta): boolean => b.recurrence !== 'once'

/**
 * Meses JÁ PAGOS que ainda pertencem à série. É o inventário que o modal
 * mostra e que decide a forma das operações em massa.
 */
export function mesesPagos(b: Conta): string[] {
  if (!b.done) return []
  return Object.keys(b.done)
    .filter((ym) => !!b.done![ym] && apareceNoMes(b, ym))
    .sort()
}

export interface ResumoEscopo {
  /** Pagas ANTES do mês aberto — o histórico que não pode ser tocado. */
  pagasAntes: number
  /** Pagas no mês aberto ou depois — também intocáveis, e mais raras. */
  pagasDepois: number
  /** true = nenhuma parcela paga; "todas" pode apagar o registro inteiro. */
  limpa: boolean
}

export function resumoEscopo(b: Conta, ym: string): ResumoEscopo {
  const pagos = mesesPagos(b)
  const pagasAntes = pagos.filter((m) => m < ym).length
  const pagasDepois = pagos.filter((m) => m >= ym).length
  return { pagasAntes, pagasDepois, limpa: pagos.length === 0 }
}

/** Menor de dois fins de série; null não limita. */
function menorFim(a: string | null | undefined, b: string): string {
  return a && a < b ? a : b
}

// ── EXCLUSÃO ────────────────────────────────────────────────────────────────

/** Só esta parcela: uma exceção no mês, a série segue. */
export function excluirParcela(b: Conta, ym: string): Conta {
  return { ...b, skip: { ...(b.skip || {}), [ym]: true } }
}

/**
 * Esta e as demais. Devolve `null` quando o registro inteiro pode sumir.
 *
 * Só some inteiro quando NADA foi pago. Havendo pagamento, a série é encerrada
 * depois do último mês pago — apagar o registro levaria junto o histórico de
 * caixa que já saiu, e o mês fechado passaria a mentir.
 */
export function excluirSerie(b: Conta, ym: string): Conta | null {
  const pagos = mesesPagos(b)
  if (pagos.length === 0) return null

  const ultimoPago = pagos[pagos.length - 1]
  if (ultimoPago < ym) {
    return { ...b, endMonth: menorFim(b.endMonth, addMonths(ym, -1)) }
  }

  // Há mês pago em ym ou depois (o dono navegou pra frente e marcou pago).
  // Preserva até ele e pula, uma a uma, as não pagas no meio — assim nenhuma
  // parcela paga desaparece e nenhuma em aberto sobrevive.
  const skip = { ...(b.skip || {}) }
  for (let m = ym; m <= ultimoPago; m = addMonths(m, 1)) {
    if (apareceNoMes(b, m) && !estaPaga(b, m)) skip[m] = true
  }
  return { ...b, skip, endMonth: menorFim(b.endMonth, ultimoPago) }
}

// ── EDIÇÃO ──────────────────────────────────────────────────────────────────

export type PatchConta = Partial<Pick<Conta, 'amount' | 'description' | 'dueDay'>>

/** Só esta parcela: override no mês, o resto da série intacto. */
export function editarParcela(b: Conta, ym: string, patch: PatchConta): Conta {
  const limpo: PatchConta = {}
  if (patch.amount != null) limpo.amount = patch.amount
  if (patch.description != null) limpo.description = patch.description
  if (patch.dueDay !== undefined) limpo.dueDay = patch.dueDay
  return { ...b, overrides: { ...(b.overrides || {}), [ym]: { ...(b.overrides?.[ym] || {}), ...limpo } } }
}

export interface ResultadoEdicaoSerie {
  /** O registro original, encerrado no mês anterior. null = não sobrou passado. */
  original: Conta | null
  /** O registro que vale de `ym` em diante, já com o patch. */
  novo: Conta
}

/**
 * Esta e as futuras. Como a série é UM registro, "não mexer no passado" exige
 * CORTAR EM DOIS: o original morre no mês anterior (guardando os pagamentos
 * que já aconteceram) e nasce um registro novo a partir do mês aberto.
 *
 * Quando não há passado nenhum (está no primeiro mês da série), não há o que
 * proteger e o registro é simplesmente alterado — dividir criaria um órfão
 * vazio.
 *
 * Se algum mês JÁ PAGO cair no pedaço novo, o valor antigo dele é fixado num
 * override. Sem isso, editar "daqui pra frente" mudaria retroativamente um
 * pagamento que já saiu do caixa.
 */
export function editarSerie(
  b: Conta,
  ym: string,
  patch: PatchConta,
  novoId: string,
): ResultadoEdicaoSerie {
  const temPassado = monthDiff(ym, b.startMonth) > 0

  if (!temPassado) {
    return { original: null, novo: { ...b, ...patch } }
  }

  const fimOriginal = addMonths(ym, -1)
  const original: Conta = { ...b, endMonth: menorFim(b.endMonth, fimOriginal) }

  // O pedaço novo leva só o que é dele: pagamentos, exceções e overrides de
  // ym em diante. Arrastar o passado junto duplicaria o histórico em dois
  // registros, e ele apareceria somado.
  const daquiPraFrente = <T,>(mapa: Record<string, T> | undefined): Record<string, T> => {
    const out: Record<string, T> = {}
    for (const k of Object.keys(mapa || {})) if (k >= ym) out[k] = mapa![k]
    return out
  }

  const overrides = daquiPraFrente(b.overrides || {})
  // Congela o valor das parcelas já pagas que caem no trecho novo.
  for (const m of mesesPagos(b)) {
    if (m >= ym) overrides[m] = { ...(overrides[m] || {}), amount: valorNoMes(b, m) }
  }

  const restantes = b.recurrence === 'installments'
    ? Math.max(1, (b.installments || 1) - monthDiff(ym, b.startMonth))
    : (b.installments || 1)

  const novo: Conta = {
    ...b,
    ...patch,
    id: novoId,
    startMonth: ym,
    endMonth: b.endMonth ?? null,
    installments: restantes,
    done: daquiPraFrente(b.done as Record<string, unknown>),
    skip: daquiPraFrente(b.skip),
    overrides,
  }

  return { original, novo }
}
