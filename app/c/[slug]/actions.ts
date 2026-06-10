'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { dataLocalStr, gerarCodigoResgate } from '@/lib/utils'
import { cicloDeData } from '@/lib/ciclo'
import type { Brinde } from '@/types/database'

interface EnviarFeedbackInput {
  slug: string
  estrelas: number          // 1-5
  barbeiroId: string | null // null = "Não lembro/Vários"
  comentario: string | null
  nomeCliente: string | null
  contatoCliente: string | null
}

interface ResultadoFeedback {
  ok: true
  brinde: { nome: string; descricao: string | null; foto_url: string | null; codigo_resgate: string; validade_dias: number } | null
  mensagemPos: string | null
  ehPositivo: boolean
  googleReviewUrl: string | null
}

/**
 * Recebe um feedback público (anon), grava em `feedbacks_cliente`,
 * sorteia brinde, concede pontos (se gamificação ON + positivo + barbeiro
 * identificado + dentro do limite diário). Retorna ao cliente:
 *   - brinde sorteado + código de resgate (NUNCA outros brindes nem
 *     probabilidades)
 *   - mensagem pós cadastrada
 *   - flag ehPositivo + url do Google (só se positivo)
 *
 * Usa admin client porque a tela é anon — RLS de INSERT é validada via
 * o filtro de slug ativo na query inicial (autorizarSlug).
 */
export async function enviarFeedback(input: EnviarFeedbackInput): Promise<{ error: string } | ResultadoFeedback> {
  const admin = createAdminClient()

  // 1. Autoriza pelo slug ativo + carrega config da barbearia
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barb } = await (admin as any)
    .from('barbearias')
    .select('id, nome, feedback_ativo, feedback_slug, feedback_mensagem_pos, feedback_google_review_url, feedback_nota_minima_positivo, feedback_gamificacao_ativa, feedback_pontos_por_feedback, feedback_limite_diario_pontuavel, dia_fechamento, brinde_validade_dias')
    .eq('feedback_slug', input.slug)
    .eq('feedback_ativo', true)
    .maybeSingle() as { data: {
      id: string; nome: string; feedback_ativo: boolean; feedback_slug: string;
      feedback_mensagem_pos: string | null; feedback_google_review_url: string | null;
      feedback_nota_minima_positivo: number; feedback_gamificacao_ativa: boolean;
      feedback_pontos_por_feedback: number; feedback_limite_diario_pontuavel: number;
      dia_fechamento: number | null; brinde_validade_dias: number | null;
    } | null }

  if (!barb) return { error: 'Link não disponível.' }

  // 2. Validação básica
  const estrelas = Math.max(1, Math.min(5, Math.round(input.estrelas || 0)))
  if (estrelas < 1) return { error: 'Selecione uma nota.' }
  const ehPositivo = estrelas >= barb.feedback_nota_minima_positivo
  const data = dataLocalStr()  // BRT

  // 3. Verifica que o barbeiro citado (se houver) é da mesma barbearia
  let barbeiroId: string | null = null
  if (input.barbeiroId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: barbeiro } = await (admin as any)
      .from('barbeiros').select('id, barbearia_id, ativo')
      .eq('id', input.barbeiroId).maybeSingle() as
      { data: { id: string; barbearia_id: string; ativo: boolean } | null }
    if (barbeiro?.barbearia_id === barb.id && barbeiro.ativo) barbeiroId = barbeiro.id
  }

  // 4. Sorteia brinde ponderado entre ativos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: brindesRaw } = await (admin as any)
    .from('brindes').select('id, nome, descricao, foto_url, peso, ativo')
    .eq('barbearia_id', barb.id).eq('ativo', true)
  const brindesAtivos = (brindesRaw ?? []) as Brinde[]
  const brinde = sortearPonderado(brindesAtivos)
  const codigoResgate = brinde ? gerarCodigoUnico(admin) : null
  const codigoRes = await codigoResgate
  const validadeDias = barb.brinde_validade_dias ?? 30

  // 5. INSERT do feedback (sem expor o admin client diretamente).
  //    `data` salva como string literal BRT — preserva o dia.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: novoFb, error: insErr } = await (admin as any)
    .from('feedbacks_cliente')
    .insert({
      barbearia_id: barb.id,
      barbeiro_id: barbeiroId,
      estrelas,
      comentario: input.comentario?.trim()?.slice(0, 500) || null,
      nome_cliente: input.nomeCliente?.trim()?.slice(0, 80) || null,
      contato_cliente: input.contatoCliente?.trim()?.slice(0, 80) || null,
      brinde_id: brinde?.id ?? null,
      codigo_resgate: codigoRes,
      brinde_atribuido_em: brinde ? new Date().toISOString() : null,
      brinde_validade_dias: brinde ? validadeDias : null,
      foi_redirecionado_google: ehPositivo && !!barb.feedback_google_review_url,
      data,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: { message: string } | null }
  if (insErr || !novoFb) return { error: 'Erro ao salvar feedback. Tenta de novo?' }

  // 6. Gamificação (atrás de 4 gates): toggle ON, positivo, barbeiro
  //    identificado, dentro do limite diário. Reusa controle_diario via
  //    o slot de servico de feedback (eh_servico_feedback=true).
  let pontosConcedidos = 0
  if (
    barb.feedback_gamificacao_ativa &&
    ehPositivo &&
    barbeiroId &&
    barb.feedback_pontos_por_feedback > 0
  ) {
    pontosConcedidos = await concederPontosDeFeedback({
      admin, barbeariaId: barb.id, barbeiroId,
      data, diaFechamento: barb.dia_fechamento ?? 1,
      pontosPorFeedback: barb.feedback_pontos_por_feedback,
      limiteDiario: barb.feedback_limite_diario_pontuavel,
      novoFeedbackId: novoFb.id,
    })
  }

  // 7. Atualiza pontos_concedidos no feedback (pra o painel do gestor).
  if (pontosConcedidos > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('feedbacks_cliente')
      .update({ pontos_concedidos: pontosConcedidos })
      .eq('id', novoFb.id)
  }

  return {
    ok: true,
    brinde: brinde && codigoRes ? {
      nome: brinde.nome, descricao: brinde.descricao,
      foto_url: brinde.foto_url, codigo_resgate: codigoRes,
      validade_dias: validadeDias,
    } : null,
    mensagemPos: barb.feedback_mensagem_pos,
    ehPositivo,
    googleReviewUrl: ehPositivo ? barb.feedback_google_review_url : null,
  }
}

/**
 * Sorteio ponderado pelo `peso` de cada brinde ativo. Peso maior = mais
 * comum. NUNCA expõe os pesos ao cliente.
 */
function sortearPonderado(brindes: Brinde[]): Brinde | null {
  if (brindes.length === 0) return null
  const total = brindes.reduce((s, b) => s + Math.max(1, b.peso), 0)
  let r = Math.random() * total
  for (const b of brindes) {
    r -= Math.max(1, b.peso)
    if (r <= 0) return b
  }
  return brindes[brindes.length - 1]
}

/** Gera um código de resgate único (retry em colisão rara). */
async function gerarCodigoUnico(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const cand = gerarCodigoResgate()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('feedbacks_cliente')
      .select('id').eq('codigo_resgate', cand).maybeSingle()
    if (!data) return cand
  }
  // fallback: appendiza random pra praticamente nunca colidir
  return gerarCodigoResgate() + Math.random().toString(36).slice(2, 5).toUpperCase()
}

/**
 * Concede pontos por feedback inserindo uma linha em `controle_diario`
 * — mesmo caminho do lançamento de pontos por serviço. Encontra (ou
 * cria) o slot de "serviço de feedback" da campanha do ciclo da data.
 *
 * Respeita o limite diário (`feedback_limite_diario_pontuavel`):
 *   - Soma já concedida hoje pra esse barbeiro nesse serviço
 *   - Se já no teto, retorna 0 (não pontua)
 *   - Se parcial, pontua até o teto
 *
 * Retorna a quantidade de pontos efetivamente concedida (0 a pontosPorFeedback).
 */
async function concederPontosDeFeedback(args: {
  admin: ReturnType<typeof createAdminClient>
  barbeariaId: string
  barbeiroId: string
  data: string                // 'YYYY-MM-DD' BRT
  diaFechamento: number
  pontosPorFeedback: number
  limiteDiario: number
  novoFeedbackId: string
}): Promise<number> {
  const { admin, barbeariaId, barbeiroId, data, diaFechamento, pontosPorFeedback, limiteDiario } = args

  // 1. Campanha do ciclo da DATA do feedback (não de hoje).
  const ciclo = cicloDeData(new Date(data + 'T12:00:00'), diaFechamento)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: camp } = await (admin as any)
    .from('campanha').select('id, ativo')
    .eq('barbearia_id', barbeariaId).eq('mes', ciclo.mesRef).eq('ano', ciclo.anoRef)
    .maybeSingle() as { data: { id: string; ativo: boolean } | null }
  if (!camp || camp.ativo === false) return 0  // sem campanha = sem pontos

  // 2. Achar (ou criar) o servico_id de feedback da campanha (slot fixo).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: serv } = await (admin as any)
    .from('campanha_servicos').select('id, pontos')
    .eq('campanha_id', camp.id).eq('eh_servico_feedback', true)
    .maybeSingle() as { data: { id: string; pontos: number } | null }
  if (!serv) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: novo } = await (admin as any)
      .from('campanha_servicos')
      .insert({
        campanha_id: camp.id,
        emoji: '⭐', nome: 'Feedback positivo',
        pontos: 1,                  // multiplicador 1 — quantidade carrega o valor
        conta_como_assinatura: false,
        eh_servico_feedback: true,
      })
      .select('id, pontos')
      .single() as { data: { id: string; pontos: number } | null }
    serv = novo
  }
  if (!serv) return 0

  // 3. Confere quanto já foi pontuado HOJE (data desse feedback) pra esse
  //    barbeiro nesse serviço — pra respeitar o limite diário.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: jaHoje } = await (admin as any)
    .from('controle_diario').select('quantidade')
    .eq('barbeiro_id', barbeiroId).eq('servico_id', serv.id).eq('data', data)
    .maybeSingle() as { data: { quantidade: number } | null }
  const usadosHoje = jaHoje?.quantidade ?? 0

  // limiteDiario é em "feedbacks por dia". Cada feedback positivo = +1
  // quantidade no controle_diario (e os pontos vem de quantidade * serv.pontos).
  if (limiteDiario > 0 && usadosHoje >= limiteDiario) return 0

  // 4. INSERT (ou UPDATE da linha do dia, somando 1).
  const novaQtd = usadosHoje + 1
  if (jaHoje) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('controle_diario')
      .update({ quantidade: novaQtd })
      .eq('barbeiro_id', barbeiroId).eq('servico_id', serv.id).eq('data', data)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('controle_diario').insert({
      barbeiro_id: barbeiroId,
      campanha_id: camp.id,
      data,
      servico_id: serv.id,
      quantidade: 1,
      lancado_por: 'dono',
    })
  }

  // 5. Retorna os pontos correspondentes a ESSE feedback (1 unidade × pontosPorFeedback).
  //    Nota: o `serv.pontos` vale 1 (multiplicador neutro), e a configuração
  //    real fica em barbearias.feedback_pontos_por_feedback. Isso permite o
  //    dono alterar os pontos sem mexer no slot de servico em si.
  //    O TOTAL exibido no dashboard usa quantidade × serv.pontos = quantidade × 1,
  //    o que dá o NÚMERO DE FEEDBACKS, não os pontos.
  //
  //    Pra manter o contrato de "pontos somam no ranking", vamos sincronizar
  //    `serv.pontos` com `pontosPorFeedback` em cada concessão (idempotente,
  //    sem impacto nas linhas existentes — só recalcula on-the-fly).
  if (serv.pontos !== pontosPorFeedback) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('campanha_servicos')
      .update({ pontos: pontosPorFeedback }).eq('id', serv.id)
  }

  return pontosPorFeedback
}
