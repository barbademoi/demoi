/**
 * REGRAS DA ASSINATURA HOTMART — lógica pura, sem I/O.
 *
 * Fica separada do webhook de propósito: é aqui que mora a decisão de quem é
 * vitalício, quem é assinante, e até quando o acesso vale. Coisa que decide
 * acesso de cliente pagante precisa ser testável sem subir servidor.
 *
 * REGRA DE OURO: vitalício nunca é rebaixado e nunca é checado por validade.
 */

// ── Identificadores da Hotmart ─────────────────────────────────────────────
export const PRODUTO_ASSINATURA = '8272423'
export const PRODUTO_VITALICIO  = '7737399'

/**
 * Ofertas do produto de assinatura. É a FONTE PRIMÁRIA da periodicidade:
 * mensal e anual são ofertas diferentes do MESMO produto, e o código da oferta
 * é estável — diferente do nome do plano (editável) e do preço (promoção).
 * Vêm do link de checkout: pay.hotmart.com/XXXX?off=<código>
 */
export const OFERTAS: Record<string, Periodicidade> = {
  vmgc66i0: 'mensal',
  '01rp1xhx': 'anual',
}

/** Preço esperado de cada periodicidade — serve de CONFERÊNCIA, não de decisão. */
export const PRECOS: Record<Periodicidade, number> = {
  mensal: 34.90,
  anual: 297,
}

export type Periodicidade = 'mensal' | 'anual'
export type TipoAcesso = 'vitalicio' | 'mensal'
export type StatusAssinatura = 'ativa' | 'atrasada' | 'cancelada' | 'revisar'

// ── Eventos ────────────────────────────────────────────────────────────────
/** Liberam/renovam acesso. */
export const EVENTOS_ATIVA = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'])
/** Cortam acesso de assinante (nunca de vitalício). */
export const EVENTOS_CANCELA = new Set([
  'SUBSCRIPTION_CANCELLATION', 'PURCHASE_CANCELED', 'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK', 'PURCHASE_PROTEST', 'PURCHASE_EXPIRED',
])
/** Pagamento atrasado — sinaliza, e a carência decide o bloqueio. */
export const EVENTOS_ATRASO = new Set(['PURCHASE_DELAYED'])
/** Mudam o plano ou a data de cobrança sem mexer no direito de acesso. */
export const EVENTOS_AJUSTE = new Set(['SWITCH_PLAN', 'UPDATE_SUBSCRIPTION_CHARGE_DATE'])

export function eventoRelevante(evento: string): boolean {
  return EVENTOS_ATIVA.has(evento) || EVENTOS_CANCELA.has(evento)
    || EVENTOS_ATRASO.has(evento) || EVENTOS_AJUSTE.has(evento)
}

// ── Leitura do payload ─────────────────────────────────────────────────────
function ler(fields: Record<string, unknown>, caminhos: string[]): string | null {
  for (const c of caminhos) {
    const v = c.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], fields)
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

export interface DadosHotmart {
  eventoId: string | null
  productId: string | null
  offerCode: string | null
  preco: number | null
  assinaturaId: string | null
  planoNome: string | null
  proximaCobranca: Date | null
}

/**
 * Extrai o que interessa, tolerando as MUITAS formas do payload.
 *
 * O código do assinante muda de lugar conforme o evento — confirmado nos
 * payloads reais: `data.subscription.subscriber.code` nas compras,
 * `data.subscriber.code` no cancelamento e na troca de data,
 * `data.subscription.subscriber_code` no SWITCH_PLAN. Por isso a lista.
 */
export function extrair(fields: Record<string, unknown>): DadosHotmart {
  const precoTxt = ler(fields, [
    'data.purchase.price.value', 'data.purchase.full_price.value',
    'price', 'purchase_price', 'full_price',
    'data.actual_recurrence_value',
  ])
  const preco = precoTxt === null ? null : Number(precoTxt)

  // Epoch em ms nos eventos v2.
  const proximaTxt = ler(fields, ['data.date_next_charge', 'data.subscription.date_next_charge'])
  let proximaCobranca: Date | null = null
  if (proximaTxt) {
    const n = Number(proximaTxt)
    const d = Number.isFinite(n) ? new Date(n) : new Date(proximaTxt)
    // Data absurda (epoch em segundos, texto inválido) é descartada.
    if (!isNaN(d.getTime()) && d.getFullYear() > 2020 && d.getFullYear() < 2100) proximaCobranca = d
  }

  return {
    eventoId: ler(fields, ['id']),
    productId: ler(fields, ['data.product.id', 'prod', 'product_id', 'data.subscription.product.id']),
    offerCode: ler(fields, ['data.purchase.offer.code', 'data.plan.offer.code', 'off', 'offer_code']),
    preco: preco !== null && Number.isFinite(preco) ? preco : null,
    assinaturaId: ler(fields, [
      'data.subscription.subscriber.code',
      'data.subscriber.code',
      'data.subscription.subscriber_code',
      'subscriber_code',
      'data.subscription.id',
    ]),
    planoNome: ler(fields, ['data.subscription.plan.name', 'data.plan.name']),
    proximaCobranca,
  }
}

// ── Classificação ──────────────────────────────────────────────────────────
export interface Classificacao {
  tipo: TipoAcesso
  periodicidade: Periodicidade | null
  /** true quando não deu pra reconhecer o produto: acesso provisório, nunca vitalício. */
  desconhecido: boolean
  avisos: string[]
}

/**
 * Decide o tipo de acesso pelo PRODUTO, e a periodicidade pela OFERTA.
 *
 * Produto desconhecido NÃO vira vitalício: seria dar acesso permanente de
 * graça por um engano de cadastro. Vira assinatura provisória marcada pra
 * revisão — o cliente que pagou não fica na rua, e o erro aparece no log.
 */
export function classificar(d: DadosHotmart): Classificacao {
  const avisos: string[] = []

  if (d.productId === PRODUTO_VITALICIO) {
    return { tipo: 'vitalicio', periodicidade: null, desconhecido: false, avisos }
  }

  const ofertaConhecida = d.offerCode ? OFERTAS[d.offerCode] : undefined
  const ehAssinatura = d.productId === PRODUTO_ASSINATURA || !!ofertaConhecida

  if (!ehAssinatura) {
    avisos.push(
      `Produto não reconhecido (product_id=${d.productId ?? 'ausente'}, oferta=${d.offerCode ?? 'ausente'}). ` +
      'Acesso NÃO concedido como vitalício; criado como assinatura pra revisão.',
    )
    return { tipo: 'mensal', periodicidade: null, desconhecido: true, avisos }
  }

  // Oferta é a fonte primária. Sem ela, cai pro preço.
  let periodicidade: Periodicidade | null = ofertaConhecida ?? null
  if (!periodicidade) {
    periodicidade = periodicidadePorPreco(d.preco)
    avisos.push(
      periodicidade
        ? `Oferta ${d.offerCode ?? 'ausente'} desconhecida; periodicidade deduzida do preço (${d.preco}).`
        : `Oferta ${d.offerCode ?? 'ausente'} desconhecida e preço (${d.preco ?? 'ausente'}) não bate com nenhum plano.`,
    )
  } else if (d.preco !== null) {
    // Conferência cruzada: oferta diz uma coisa, preço diz outra → grava o que
    // a oferta disse (é o identificador estável) e deixa o erro registrado.
    const esperado = PRECOS[periodicidade]
    const bate = Math.abs(d.preco - esperado) < 0.01
    if (!bate) {
      avisos.push(
        `Divergência: oferta ${d.offerCode} indica ${periodicidade} (esperado R$ ${esperado}), ` +
        `mas o preço veio R$ ${d.preco}. Mantido ${periodicidade}; confira se houve promoção ou troca de oferta.`,
      )
    }
  }

  if (d.productId && d.productId !== PRODUTO_ASSINATURA && ofertaConhecida) {
    avisos.push(
      `Oferta ${d.offerCode} é de assinatura, mas o product_id veio ${d.productId} ` +
      `(esperado ${PRODUTO_ASSINATURA}). Tratado como assinatura.`,
    )
  }

  return { tipo: 'mensal', periodicidade, desconhecido: false, avisos }
}

function periodicidadePorPreco(preco: number | null): Periodicidade | null {
  if (preco === null) return null
  for (const p of ['mensal', 'anual'] as Periodicidade[]) {
    if (Math.abs(preco - PRECOS[p]) < 0.01) return p
  }
  return null
}

// ── Validade ───────────────────────────────────────────────────────────────
/**
 * Calcula até quando o acesso vale depois de um pagamento aprovado.
 *
 * - Estende a partir do `valido_ate` atual se ele estiver no FUTURO (quem
 *   renova adiantado não perde os dias que já pagou); se venceu, conta de hoje.
 * - `proximaCobranca` da Hotmart, quando vem, TEM PRECEDÊNCIA: é a data que a
 *   própria plataforma vai cobrar, então é ela que define o direito de acesso,
 *   sem eu errar por mês de 28 dias ou fuso.
 * - Periodicidade desconhecida ganha 7 dias, tempo de alguém revisar — não
 *   deixa o cliente na rua nem dá um ano de graça.
 */
export function calcularValidoAte(
  agora: Date,
  validoAteAtual: Date | null,
  periodicidade: Periodicidade | null,
  proximaCobranca: Date | null,
): Date {
  if (proximaCobranca && proximaCobranca.getTime() > agora.getTime()) return proximaCobranca

  const base = validoAteAtual && validoAteAtual.getTime() > agora.getTime() ? validoAteAtual : agora

  if (periodicidade === 'anual')  return adicionarMeses(base, 12)
  if (periodicidade === 'mensal') return adicionarMeses(base, 1)

  const d = new Date(base.getTime())
  d.setDate(d.getDate() + 7)
  return d
}

/**
 * Soma meses SEM transbordar de mês.
 *
 * `setMonth` puro erra quando o dia não existe no mês de destino: 31/jan + 1
 * mês vira 03/mar, e quem assina dia 31 ganha dias de graça todo mês. Aqui o
 * dia é grampeado no último dia do mês de destino — 31/jan + 1 mês = 28/fev.
 */
function adicionarMeses(base: Date, meses: number): Date {
  const dia = base.getUTCDate()
  const d = new Date(Date.UTC(
    base.getUTCFullYear(), base.getUTCMonth() + meses, 1,
    base.getUTCHours(), base.getUTCMinutes(), base.getUTCSeconds(), base.getUTCMilliseconds(),
  ))
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(dia, ultimoDia))
  return d
}

/**
 * Estado da assinatura a partir do evento. Vitalício não passa por aqui —
 * quem chama checa o tipo antes.
 */
export function statusDoEvento(evento: string): StatusAssinatura | null {
  if (EVENTOS_ATIVA.has(evento)) return 'ativa'
  if (EVENTOS_CANCELA.has(evento)) return 'cancelada'
  if (EVENTOS_ATRASO.has(evento)) return 'atrasada'
  return null
}
