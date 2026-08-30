import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  extrair, classificar, calcularValidoAte, calcularValidoAteAnual,
  statusDoEvento, eventoRelevante, EVENTOS_ATIVA,
} from '@/lib/assinatura/hotmart'

function gerarSenhaInterna(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  return Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

interface NormalizedPayload {
  event: string
  buyer: { name: string; email: string }
  purchase: { status: string; transaction: string }
}

// Detecta a fonte do hottok e retorna valor + descrição para log
function resolveHottok(
  headers: Headers,
  searchParams: URLSearchParams,
  fields: Record<string, unknown>,
): { value: string | null; source: string } {
  const candidates: [string | null, string][] = [
    [headers.get('x-hotmart-hottok'), 'header:x-hotmart-hottok'],
    [headers.get('x-hotmart-hottoken'), 'header:x-hotmart-hottoken'],
    [searchParams.get('hottok'), 'query:hottok'],
    [typeof fields.hottok === 'string' ? fields.hottok : null, 'body:hottok'],
  ]
  for (const [value, source] of candidates) {
    if (value) return { value, source }
  }
  return { value: null, source: 'none' }
}

// Normaliza v1 (form-urlencoded flat) e v2/testes (JSON aninhado) para estrutura interna
function normalizePayload(
  fields: Record<string, unknown>,
  isFormData: boolean,
): NormalizedPayload {
  if (isFormData) {
    const f = fields as Record<string, string>
    const status = (f.status ?? '').toLowerCase()
    const statusToEvent: Record<string, string> = {
      approved:   'PURCHASE_APPROVED',
      canceled:   'PURCHASE_CANCELED',
      refunded:   'PURCHASE_REFUNDED',
      chargeback: 'PURCHASE_CHARGEBACK',
      expired:    'PURCHASE_EXPIRED',
    }
    const event = statusToEvent[status] ?? `PURCHASE_${status.toUpperCase()}`
    const name = (f.name || [f.first_name, f.last_name].filter(Boolean).join(' ')).trim()
    return {
      event,
      buyer:    { email: (f.email ?? '').toLowerCase().trim(), name },
      purchase: {
        status:      status === 'approved' ? 'APPROVED' : status.toUpperCase(),
        transaction: (f.transaction ?? f.trk ?? '').trim(),
      },
    }
  }

  // JSON aninhado (testes manuais / webhook v2 futura)
  const b = fields as {
    event?: string
    data?: {
      buyer?: { name?: string; email?: string }
      purchase?: { status?: string; transaction?: string }
    }
  }
  return {
    event:    b.event ?? '',
    buyer:    {
      email: (b.data?.buyer?.email ?? '').toLowerCase().trim(),
      name:  (b.data?.buyer?.name  ?? '').trim(),
    },
    purchase: {
      status:      b.data?.purchase?.status ?? '',
      transaction: (b.data?.purchase?.transaction ?? '').trim(),
    },
  }
}

// ── DIAGNÓSTICO (temporário) ──────────────────────────────────────────────
// Grava o payload cru pra descobrir, com dado real, qual campo separa MENSAL
// de ANUAL dentro do produto de assinatura. Não altera nenhuma regra de
// acesso e NUNCA derruba o webhook: qualquer erro aqui é engolido.

/** Caminhos onde a Hotmart costuma pôr cada dado, entre v1 (flat) e v2 (aninhado). */
function primeiro(fields: Record<string, unknown>, caminhos: string[]): string | null {
  for (const c of caminhos) {
    const v = c.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], fields)
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

/** Documento, telefone e endereço não servem ao diagnóstico — saem do registro. */
function mascarar(valor: unknown): unknown {
  const SENSIVEIS = /^(doc|document|cpf|cnpj|phone|celular|telefone|checkout_phone|address|endereco|zipcode|cep|street|number|complement|neighborhood)/i
  if (Array.isArray(valor)) return valor.map(mascarar)
  if (valor && typeof valor === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      out[k] = SENSIVEIS.test(k) ? '***' : mascarar(v)
    }
    return out
  }
  return valor
}

async function registrarPayload(
  fields: Record<string, unknown>,
  isFormData: boolean,
  evento: string,
  email: string,
  transacao: string,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = createAdminClient()
    const linha = {
      evento,
      email: email || null,
      transacao: transacao || null,
      formato: isFormData ? 'form' : 'json',
      product_id: primeiro(fields, ['prod', 'product_id', 'data.product.id', 'product.id']),
      preco_valor: Number(
        primeiro(fields, ['price', 'purchase_price', 'data.purchase.price.value', 'full_price']) ?? '',
      ) || null,
      preco_moeda: primeiro(fields, ['currency', 'currency_code', 'data.purchase.price.currency_value']),
      assinatura_id: primeiro(fields, [
        'subscriber_code', 'subscription_id',
        'data.subscription.subscriber.code', 'data.subscription.subscriber_code', 'data.subscription.id',
      ]),
      // Vários candidatos: qual deles vem preenchido é justamente o que este log
      // existe pra descobrir. O payload completo fica em `payload`.
      periodicidade: primeiro(fields, [
        'recurrency_period', 'subscription_plan_name', 'plan', 'frequency',
        'data.subscription.plan.recurrency_period', 'data.subscription.plan.name',
        'data.purchase.recurrence_number', 'data.purchase.offer.payment_mode',
      ]),
      payload: mascarar(fields),
    }
    const { error } = await supabase.from('hotmart_webhook_log').insert(linha)
    if (error) console.error('[webhook/hotmart] log falhou (ignorado):', error.message)
    else console.log('[webhook/hotmart] payload registrado | prod:', linha.product_id, '| periodicidade?:', linha.periodicidade, '| preço:', linha.preco_valor)
  } catch (err) {
    // Diagnóstico jamais pode quebrar o recebimento da compra.
    console.error('[webhook/hotmart] log falhou (ignorado):', err)
  }
}

/**
 * Aplica cancelamento / atraso / ajuste de plano numa conta que já existe.
 *
 * VITALÍCIO NUNCA É TOCADO: é a regra de ouro do sistema. Um vitalício que um
 * dia assinar e depois cancelar continua vitalício — o cancelamento é da
 * assinatura, não do direito que ele comprou.
 */
async function aplicarEventoAssinatura(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  evento: string,
  email: string,
  dados: ReturnType<typeof extrair>,
): Promise<string> {
  // Acha pelo código do assinante (estável entre renovações) e, se não achar,
  // pelo e-mail.
  let conta: { id: string; tipo_acesso: string } | null = null
  if (dados.assinaturaId) {
    const { data } = await supabase
      .from('usuarios').select('id, tipo_acesso')
      .eq('assinatura_id', dados.assinaturaId).maybeSingle()
    conta = data ?? null
  }
  if (!conta && email) {
    const { data } = await supabase
      .from('usuarios').select('id, tipo_acesso')
      .eq('email', email).maybeSingle()
    conta = data ?? null
  }
  if (!conta) {
    console.warn('[webhook/hotmart] evento de assinatura sem conta correspondente:', evento, email, dados.assinaturaId)
    return 'Account not found'
  }

  if (conta.tipo_acesso === 'vitalicio') {
    console.log('[webhook/hotmart] vitalício preservado, evento ignorado:', evento, email)
    return 'Lifetime access preserved'
  }

  const patch: Record<string, unknown> = {}
  const status = statusDoEvento(evento)
  if (status) patch.status_assinatura = status

  // A Hotmart informa a próxima cobrança nesses eventos — é a data mais
  // confiável de validade que existe, melhor que qualquer conta minha.
  if (dados.proximaCobranca) patch.valido_ate = dados.proximaCobranca.toISOString()

  // Troca de plano: a periodicidade pode ter mudado.
  const nova = classificar(dados)
  if (evento === 'SWITCH_PLAN' && nova.periodicidade) patch.periodicidade = nova.periodicidade

  // ESTORNO DE COMPRA ÚNICA encerra o acesso na hora.
  // No assinante recorrente, marcar 'cancelada' basta: ele já pagou o período
  // corrente e o corte é não renovar. Na compra única de 1 ano é o contrário —
  // o dinheiro voltou pro cliente, e sem encerrar a validade ele ficaria um ano
  // inteiro usando o sistema de graça. Só vale pro tipo 'anual': o
  // comportamento do assinante recorrente fica exatamente como era.
  const ESTORNOS = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_PROTEST', 'PURCHASE_CANCELED'])
  if (conta.tipo_acesso === 'anual' && ESTORNOS.has(evento)) {
    patch.valido_ate = new Date().toISOString()
    console.log('[webhook/hotmart] acesso anual encerrado por estorno:', evento, email)
  }

  if (Object.keys(patch).length === 0) return 'Nothing to update'

  const { error } = await supabase.from('usuarios').update(patch).eq('id', conta.id)
  if (error) {
    console.error('[webhook/hotmart] erro ao aplicar evento de assinatura:', error)
    return 'Update failed'
  }
  console.log('[webhook/hotmart] assinatura atualizada:', evento, email, patch)
  return 'Subscription updated'
}

export async function POST(request: NextRequest) {
  // ── 1. Ler body raw ───────────────────────────────────────────────────────
  const rawBody     = await request.text()
  const contentType = request.headers.get('content-type') ?? ''
  const isFormData  = contentType.includes('application/x-www-form-urlencoded')
  console.log('[webhook/hotmart] content-type:', contentType)

  // ── 2. Parse do body ──────────────────────────────────────────────────────
  let fields: Record<string, unknown> = {}
  if (isFormData) {
    const params = new URLSearchParams(rawBody)
    params.forEach((v, k) => { fields[k] = v })
  } else {
    try {
      fields = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
  }

  // ── 3. Validar Hottok ─────────────────────────────────────────────────────
  const secret = process.env.HOTMART_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook/hotmart] HOTMART_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const { value: hottok, source: hottokSource } = resolveHottok(
    request.headers,
    request.nextUrl.searchParams,
    fields,
  )
  console.log('[webhook/hotmart] hottok source:', hottokSource)

  if (hottok !== secret) {
    console.warn('[webhook/hotmart] token inválido | source:', hottokSource)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 4. Normalizar payload ─────────────────────────────────────────────────
  const payload = normalizePayload(fields, isFormData)
  const { buyer, purchase } = payload
  console.log('[webhook/hotmart] event:', payload.event, '| email:', buyer.email, '| nome:', buyer.name, '| tx:', purchase.transaction)

  // Registra ANTES do filtro de evento: os eventos de assinatura (cancelamento,
  // troca de plano, atraso) são justamente os que hoje param aqui, e são eles
  // que precisamos ver. Só entra payload já autenticado pelo hottok.
  await registrarPayload(fields, isFormData, payload.event, buyer.email, purchase.transaction)

  const supabaseAdmin = createAdminClient()
  const dados = extrair(fields)
  const acesso = classificar(dados)
  for (const aviso of acesso.avisos) console.error('[webhook/hotmart][ATENÇÃO]', aviso)

  // ── IDEMPOTÊNCIA ─────────────────────────────────────────────────────────
  // Todo evento v2 traz um `id` único; a retentativa da Hotmart repete o mesmo.
  // Sem isto, uma retentativa de PURCHASE_APPROVED estenderia valido_ate duas
  // vezes. Sem `id` (v1 form), monta uma chave com o que dá pra identificar.
  const chaveEvento = dados.eventoId
    ?? `${payload.event}:${purchase.transaction || 's/tx'}:${dados.assinaturaId ?? 's/assin'}`
  if (eventoRelevante(payload.event)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errDup } = await (supabaseAdmin as any)
      .from('hotmart_eventos_processados')
      .insert({ evento_id: chaveEvento, evento: payload.event, assinatura_id: dados.assinaturaId })
    if (errDup) {
      // 23505 = violação de unique → já processamos. Qualquer outro erro segue,
      // porque perder um pagamento é pior do que processar duas vezes.
      if ((errDup as { code?: string }).code === '23505') {
        console.log('[webhook/hotmart] evento repetido, ignorado:', chaveEvento)
        return NextResponse.json({ ok: true, message: 'Already processed' })
      }
      console.error('[webhook/hotmart] falha ao registrar idempotência (seguindo):', errDup)
    }
  }

  // ── EVENTOS DE ASSINATURA (cancelamento, atraso, ajuste) ─────────────────
  // Só mexem em quem JÁ existe, e NUNCA em vitalício.
  if (eventoRelevante(payload.event) && !EVENTOS_ATIVA.has(payload.event)) {
    const r = await aplicarEventoAssinatura(supabaseAdmin, payload.event, buyer.email, dados)
    return NextResponse.json({ ok: true, message: r })
  }

  if (payload.event !== 'PURCHASE_APPROVED' && payload.event !== 'PURCHASE_COMPLETE') {
    console.log('[webhook/hotmart] evento ignorado:', payload.event)
    return NextResponse.json({ ok: true, message: 'Event ignored' })
  }

  if (!buyer.email || !buyer.name || !['APPROVED', 'COMPLETED', 'COMPLETE'].includes(purchase.status)) {
    console.warn('[webhook/hotmart] payload inválido:', { email: buyer.email, name: buyer.name, status: purchase.status })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const email              = buyer.email
  const nome               = buyer.name
  const hotmartTransaction = purchase.transaction

  // ── 5. Lookup idempotente: 1º por transação, 2º por email ────────────────
  // - Transação é a unica chave estavel por compra: garante idempotência real
  //   contra retentativas da Hotmart (mesmo evento chega N vezes → 1 conta).
  // - Email é fallback: cliente existente comprando produto novo (transação
  //   diferente, mesmo email) → atualiza o registro, nao duplica.
  const supabase = supabaseAdmin

  type ExistenteRow = { id: string; email: string; hotmart_transaction: string | null; tipo_acesso: string | null; valido_ate: string | null }
  let existente: ExistenteRow | null = null

  if (hotmartTransaction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('usuarios')
      .select('id, email, hotmart_transaction, tipo_acesso, valido_ate')
      .eq('hotmart_transaction', hotmartTransaction)
      .maybeSingle()
    existente = (data as ExistenteRow | null) ?? null
  }

  if (!existente) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('usuarios')
      .select('id, email, hotmart_transaction, tipo_acesso, valido_ate')
      .eq('email', email)
      .maybeSingle()
    existente = (data as ExistenteRow | null) ?? null
  }

  // ── 6. Se ja existe: atualiza somente o que mudou (idempotente) ──────────
  if (existente) {
    const emailMudou = existente.email.toLowerCase() !== email.toLowerCase()
    const txMudou    = !!hotmartTransaction && existente.hotmart_transaction !== hotmartTransaction

    // Email mudou → propaga em auth.users + auth.identities via Admin API
    // (a API garante sync das duas tabelas; SQL direto quebraria login).
    if (emailMudou) {
      const { error: errAuthUpd } = await supabase.auth.admin.updateUserById(existente.id, {
        email,
        email_confirm: true,
      })
      if (errAuthUpd) {
        console.error('[webhook/hotmart] erro ao atualizar email no auth:', errAuthUpd)
        return NextResponse.json({ error: 'Failed to update auth email' }, { status: 500 })
      }
    }

    // ── ACESSO: nunca rebaixa vitalício ──────────────────────────────────
    // Vitalício que compra assinatura CONTINUA vitalício. Ele já pagou pelo
    // acesso permanente; a assinatura nova não pode transformá-lo em alguém
    // que perde o sistema quando parar de pagar.
    const acessoPatch: Record<string, unknown> = {}
    const validoAtual = existente.valido_ate ? new Date(existente.valido_ate) : null

    if (existente.tipo_acesso === 'vitalicio') {
      // ESTE É O RAMO QUE PROTEGE OS ~600 VITALÍCIOS.
      // O produto 7737399 vendia acesso permanente e hoje vende 1 ano. Quem
      // comprou na época do permanente comprou permanente — uma compra nova,
      // um reenvio de webhook ou qualquer evento futuro desse produto passa
      // por aqui e NÃO ESCREVE NADA. Nem valido_ate, nem tipo, nem status.
      console.log('[webhook/hotmart] vitalício mantido apesar da nova compra:', email)
    } else if (acesso.tipo === 'vitalicio') {
      // Hoje NENHUM produto classifica como vitalício — `classificar` deixou de
      // devolver esse tipo quando o 7737399 virou anual. O ramo fica porque a
      // decisão é de negócio e pode voltar; se voltar, o comportamento certo
      // (subir de patamar e largar a régua de validade) já está aqui.
      acessoPatch.tipo_acesso = 'vitalicio'
      acessoPatch.status_assinatura = null
      acessoPatch.valido_ate = null
      acessoPatch.periodicidade = null
    } else if (acesso.tipo === 'anual') {
      // COMPRA ÚNICA DE 1 ANO. Renovar é comprar de novo pelo mesmo link:
      // se ainda está dentro da validade, o ano novo soma a partir dela e
      // ninguém perde dia pago.
      acessoPatch.tipo_acesso = 'anual'
      acessoPatch.status_assinatura = 'ativa'
      acessoPatch.periodicidade = 'anual'
      acessoPatch.valido_ate = calcularValidoAteAnual(new Date(), validoAtual).toISOString()
    } else {
      acessoPatch.tipo_acesso = 'mensal'
      acessoPatch.status_assinatura = acesso.desconhecido ? 'revisar' : 'ativa'
      acessoPatch.periodicidade = acesso.periodicidade
      acessoPatch.valido_ate = calcularValidoAte(
        new Date(), validoAtual, acesso.periodicidade, dados.proximaCobranca,
      ).toISOString()
      if (dados.assinaturaId) acessoPatch.assinatura_id = dados.assinaturaId
    }

    // TRAVA ANTI-ENCOLHIMENTO: nenhum evento pode devolver uma validade MENOR
    // do que a que já estava gravada. Vale principalmente pra quem tem 1 ano
    // pago e assina o mensal por cima — o mês novo não pode comer os meses que
    // ele já comprou. Uma trava aqui é mais barata que um pedido de reembolso.
    if (typeof acessoPatch.valido_ate === 'string' && validoAtual) {
      const proposto = new Date(acessoPatch.valido_ate as string)
      if (proposto.getTime() < validoAtual.getTime()) {
        console.log('[webhook/hotmart] validade proposta menor que a atual; mantida a maior:', email)
        acessoPatch.valido_ate = validoAtual.toISOString()
      }
    }

    if (emailMudou || txMudou || Object.keys(acessoPatch).length > 0) {
      const patch: Record<string, unknown> = { ...acessoPatch }
      if (emailMudou) patch.email = email
      if (txMudou)    patch.hotmart_transaction = hotmartTransaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: errUpd } = await (supabase as any)
        .from('usuarios')
        .update(patch)
        .eq('id', existente.id)
      if (errUpd) {
        console.error('[webhook/hotmart] erro ao atualizar usuarios:', errUpd)
        return NextResponse.json({ error: 'Failed to update usuario' }, { status: 500 })
      }
    }

    console.log('[webhook/hotmart] ja cadastrado — atualizado:', {
      id: existente.id, emailMudou, txMudou,
    })
    return NextResponse.json({
      ok: true,
      message: 'Already registered',
      updated: { email: emailMudou, transaction: txMudou },
    })
  }

  // ── 7. Nao existe: cria barbearia + auth user + usuarios ──────────────────
  const primeiroNome = nome.split(' ')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbearia, error: errBarbearia } = await (supabase as any)
    .from('barbearias')
    .insert({ nome: `Barbearia ${primeiroNome}`, onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[webhook/hotmart] erro ao criar barbearia:', errBarbearia)
    return NextResponse.json({ error: 'Failed to create barbearia' }, { status: 500 })
  }

  const barbeariaId: string = (barbearia as { id: string }).id
  console.log('[webhook/hotmart] barbearia criada:', barbeariaId)

  const senha = gerarSenhaInterna()

  const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (errAuth || !authData.user) {
    console.error('[webhook/hotmart] erro ao criar auth user:', errAuth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const userId = authData.user.id
  console.log('[webhook/hotmart] auth user criado:', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: errUsuario } = await (supabase as any)
    .from('usuarios')
    .insert({
      id: userId,
      barbearia_id: barbeariaId,
      email,
      senha_definida: false,
      hotmart_transaction: hotmartTransaction || null,
      // EXPLÍCITO, nunca por default: produto desconhecido não pode virar
      // vitalício por omissão. `classificar` já garante isso.
      tipo_acesso: acesso.tipo,
      origem: `hotmart:${dados.productId ?? 'desconhecido'}`,
      ...(acesso.tipo === 'anual' ? {
        // 1 ano a partir de agora. Sem assinatura_id: não há recorrência.
        status_assinatura: 'ativa',
        periodicidade: 'anual',
        valido_ate: calcularValidoAteAnual(new Date(), null).toISOString(),
      } : {}),
      ...(acesso.tipo === 'mensal' ? {
        status_assinatura: acesso.desconhecido ? 'revisar' : 'ativa',
        periodicidade: acesso.periodicidade,
        assinatura_id: dados.assinaturaId,
        valido_ate: calcularValidoAte(new Date(), null, acesso.periodicidade, dados.proximaCobranca).toISOString(),
      } : {}),
    })

  if (errUsuario) {
    console.error('[webhook/hotmart] erro ao criar usuario:', errUsuario)
    await supabase.auth.admin.deleteUser(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('barbearias').delete().eq('id', barbeariaId)
    return NextResponse.json({ error: 'Failed to create usuario' }, { status: 500 })
  }

  console.log('[webhook/hotmart] conta criada com sucesso:', email, '| barbearia:', barbeariaId)
  return NextResponse.json({ ok: true, message: 'Created' })
}
