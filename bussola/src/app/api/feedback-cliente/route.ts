import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { gerarCodigoResgate, sortearBrinde, type BrindeLite } from '@/lib/feedbackCliente'

interface Body {
  slug?: string
  estrelas?: number
  colaborador_id?: string | null
  comentario?: string | null
  nome_cliente?: string | null
}

const LIMITE_POR_HORA = 5

function sanitizar(s: string | null | undefined, max = 500): string | null {
  if (!s) return null
  // Escape básico de < e > pra evitar HTML.
  const limpo = s.replace(/[<>]/g, '').trim().slice(0, max)
  return limpo || null
}

function pegarIp(req: Request): string {
  const h = req.headers
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return h.get('x-real-ip') ?? '0.0.0.0'
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body

  if (!body.slug) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  const estrelas = Number(body.estrelas)
  if (!Number.isInteger(estrelas) || estrelas < 1 || estrelas > 5) {
    return NextResponse.json({ error: 'Avaliação inválida.' }, { status: 400 })
  }

  const comentario = sanitizar(body.comentario, 500)
  const nomeCliente = sanitizar(body.nome_cliente, 80)
  const colabId = body.colaborador_id || null

  const admin = createAdminClient()

  // Tenta select com brinde_validade_dias + google_reviews_url (migrations
  // 018 + 019); cai pro mínimo se as colunas ainda não existem.
  let est: { id: string; feedback_cliente_ativo: boolean; brinde_validade_dias: number; google_reviews_url: string | null } | null = null
  const estCompleto = await admin
    .from('estabelecimentos')
    .select('id, feedback_cliente_ativo, brinde_validade_dias, google_reviews_url')
    .eq('link_feedback_cliente_slug', body.slug)
    .maybeSingle()
  if (estCompleto.data) {
    est = {
      id: estCompleto.data.id as string,
      feedback_cliente_ativo: !!estCompleto.data.feedback_cliente_ativo,
      brinde_validade_dias: (estCompleto.data.brinde_validade_dias as number | null) ?? 30,
      google_reviews_url: (estCompleto.data.google_reviews_url as string | null) ?? null,
    }
  } else {
    const estMin = await admin
      .from('estabelecimentos')
      .select('id, feedback_cliente_ativo')
      .eq('link_feedback_cliente_slug', body.slug)
      .maybeSingle()
    if (estMin.data) {
      est = {
        id: estMin.data.id as string,
        feedback_cliente_ativo: !!estMin.data.feedback_cliente_ativo,
        brinde_validade_dias: 30,
        google_reviews_url: null,
      }
    }
  }
  if (!est || !est.feedback_cliente_ativo) {
    return NextResponse.json({ error: 'Link não disponível.' }, { status: 404 })
  }
  const validadeDias = est.brinde_validade_dias
  const googleReviewsUrl = est.google_reviews_url

  // Confere colaborador, se enviado.
  if (colabId) {
    const { data: c } = await admin
      .from('profissionais')
      .select('id')
      .eq('id', colabId)
      .eq('estabelecimento_id', est.id)
      .eq('status', 'ativo')
      .maybeSingle()
    if (!c) return NextResponse.json({ error: 'Colaborador inválido.' }, { status: 400 })
  }

  // Rate limit por IP — 5/hora.
  const ip = pegarIp(req)
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('feedbacks_cliente')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', umaHoraAtras)
  if ((count ?? 0) >= LIMITE_POR_HORA) {
    return NextResponse.json({ error: 'Muitos envios deste dispositivo. Tente novamente mais tarde.' }, { status: 429 })
  }

  // Sorteio só rola se houve comentário.
  let brindeSorteado: (BrindeLite & { descricao: string | null }) | null = null
  let codigoResgate: string | null = null
  if (comentario) {
    const { data: brindesAtivos } = await admin
      .from('brindes')
      .select('id, nome, descricao, peso')
      .eq('estabelecimento_id', est.id)
      .eq('ativo', true)
    const pool = (brindesAtivos ?? []) as (BrindeLite & { descricao: string | null })[]
    const escolhido = sortearBrinde(pool)
    if (escolhido) {
      brindeSorteado = pool.find((b) => b.id === escolhido.id) ?? null
      codigoResgate = await gerarCodigoUnico(admin)
    }
  }

  const identificado = !!nomeCliente

  // Condição pra oferecer Google Reviews: 5 estrelas + comentário + url
  // cadastrada + identificação completa (nomeCliente).
  const convidarGoogle = estrelas === 5 && !!comentario && !!googleReviewsUrl && !!nomeCliente

  // Insere com brinde_validade_dias + convidado_google (snapshots); se as
  // colunas ainda não existem, tenta sem elas.
  const payloadBase = {
    estabelecimento_id: est.id,
    profissional_id: colabId,
    nome_cliente: nomeCliente,
    identificado,
    estrelas,
    comentario,
    brinde_id: brindeSorteado?.id ?? null,
    codigo_resgate: codigoResgate,
    status: 'novo',
    ip_address: ip,
  }
  let insertResult = await admin
    .from('feedbacks_cliente')
    .insert({
      ...payloadBase,
      brinde_validade_dias: brindeSorteado ? validadeDias : null,
      convidado_google: convidarGoogle,
    })
    .select('id')
    .single()
  if (insertResult.error) {
    insertResult = await admin
      .from('feedbacks_cliente')
      .insert(payloadBase)
      .select('id')
      .single()
  }
  if (insertResult.error || !insertResult.data) {
    console.error('[feedback-cliente] insert', insertResult.error)
    return NextResponse.json({ error: 'Não foi possível registrar.' }, { status: 500 })
  }
  const feedbackId = insertResult.data.id as string

  return NextResponse.json({
    sucesso: true,
    feedback_id: feedbackId,
    ganhou_brinde: !!brindeSorteado,
    brinde: brindeSorteado && codigoResgate
      ? {
          nome: brindeSorteado.nome,
          descricao: brindeSorteado.descricao,
          codigo_resgate: codigoResgate,
          validade_dias: validadeDias,
        }
      : null,
    google_reviews: convidarGoogle ? { url: googleReviewsUrl } : null,
  })
}

async function gerarCodigoUnico(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const c = gerarCodigoResgate()
    const { data } = await admin
      .from('feedbacks_cliente')
      .select('id')
      .eq('codigo_resgate', c)
      .maybeSingle()
    if (!data) return c
  }
  // Fallback: tamanho 8 chars praticamente nunca colide.
  return gerarCodigoResgate() + gerarCodigoResgate().slice(0, 2)
}
