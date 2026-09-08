import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cicloDeData } from '@/lib/ciclo'
import { estaFechado } from '@/lib/mesFechado'
import {
  conciliar, resumir, mensagensDoResumo, tudoFalhouAoGravar,
  nomesParaRegistrarPendencia, normalizarNome,
  type BarbeiroDoBanco, type DeParaConfirmado,
} from '@/lib/importAgenda/conciliacao'

/**
 * IMPORT DA EXTENSÃO (Agenda Serviço → BarberMeta).
 *
 * Recebe da extensão de Chrome os dados JÁ EXTRAÍDOS do relatório do Agenda
 * Serviço (reaproveitando a sessão logada do dono no navegador dele) e grava
 * no MESMO modelo do lançamento diário: acumulado por barbeiro no ciclo +
 * "foto" do dia em lancamentos_diarios (sobrescreve o dia se reenviado, não
 * duplica). Nada de senha — a extensão nunca manda credencial; este endpoint
 * é protegido por TOKEN (AGENDA_IMPORT_TOKEN) e atrela à conta configurada em
 * AGENDA_IMPORT_EMAIL. Fuso America/Sao_Paulo (ciclo via dia_fechamento).
 *
 * Payload:
 * {
 *   referencia: "YYYY-MM-DD",           // dia do relatório (define o ciclo)
 *   barbeiros: [{ nome, faturamento?, comissao?, servicos?, produtos?,
 *                 assinaturas?, atendimentos? }],  // ACUMULADO do ciclo
 *   casa?: { faturamento?, servicos?, produtos?, assinaturas? }  // totais da
 *                 // barbearia (fonte JSON confiável do Agenda Serviço); quando
 *                 // presente, define o faturamento da meta da casa direto.
 * }
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supa = any

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

interface BarbeiroPayload {
  nome: string
  faturamento?: number
  comissao?: number
  servicos?: number
  produtos?: number
  assinaturas?: number
  atendimentos?: number
}

interface CasaPayload {
  faturamento?: number
  servicos?: number
  produtos?: number
  assinaturas?: number
}

/**
 * SONDA (GET) — separa três perguntas que antes só davam uma resposta junta.
 *
 * Quando a extensão dizia "Falha ao falar com o BarberMeta", isso podia ser:
 * (a) a URL não é alcançável dali, (b) é alcançável mas o cookie da sessão não
 * viaja, (c) chega e a conta não existe. As três levam a ações diferentes e a
 * mensagem única mandava caçar internet quando o problema era login.
 *
 * Responde 200 SEMPRE, inclusive deslogado: o 200 é justamente a prova de
 * alcance. `logado` responde a segunda pergunta e `email` diz em qual conta a
 * importação vai cair — é a sessão de quem chamou, ninguém vê a de outro.
 */
export async function GET() {
  let logado = false
  let email: string | null = null
  try {
    const sessao = createClient()
    const { data: { user } } = await sessao.auth.getUser()
    if (user?.email) { logado = true; email = user.email }
  } catch {
    // Sem cookie, cookie expirado ou Supabase fora do ar: não logado. A sonda
    // não pode quebrar — ela existe pra responder, não pra dar outro erro.
  }

  return NextResponse.json(
    {
      ok: true,
      logado,
      email,
      // Só pra quem já provou ser o dono da sessão. Dizer a um chamador anônimo
      // que o caminho por token está configurado é entregar pista de graça.
      ...(logado ? { tokenConfigurado: Boolean(process.env.AGENDA_IMPORT_TOKEN && process.env.AGENDA_IMPORT_EMAIL) } : {}),
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}

export async function POST(request: NextRequest) {
  // ── 1. Quem está mandando ─────────────────────────────────────────────────
  //
  // Dois caminhos, e o primeiro existe pra dispensar o segundo.
  //
  // SESSÃO: a extensão manda o cookie do BarberMeta (credentials: 'include').
  // Se o dono está logado no mesmo navegador, isso já diz quem ele é e em qual
  // barbearia gravar. Sem token, sem variável de ambiente, sem redeploy — e
  // mais correto do que o token, porque cada dono importa pra barbearia DELE
  // em vez de todo mundo cair na conta de um e-mail fixo.
  //
  // TOKEN: continua valendo pra quem já configurou e pra chamada sem
  // navegador. Ele é conferido primeiro só quando veio no cabeçalho.
  const tokenServidor = process.env.AGENDA_IMPORT_TOKEN
  const emailServidor = process.env.AGENDA_IMPORT_EMAIL
  const auth = request.headers.get('authorization') ?? ''
  const tokenEnviado = auth.replace(/^Bearer\s+/i, '').trim() || request.headers.get('x-import-token') || ''

  let emailDoDono: string | null = null

  if (tokenEnviado) {
    if (!tokenServidor || tokenEnviado !== tokenServidor) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    if (!emailServidor) {
      console.error('[import-agenda] AGENDA_IMPORT_EMAIL não configurado')
      return NextResponse.json({ error: 'Importação indisponível no momento.' }, { status: 500 })
    }
    emailDoDono = emailServidor
  } else {
    // Sem token: tenta a sessão do navegador.
    const sessao = createClient()
    const { data: { user } } = await sessao.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({
        error: 'Entre no BarberMeta neste navegador e tente de novo. '
          + '(Ou configure o token na extensão, se preferir usar sem estar logado.)',
      }, { status: 401 })
    }
    emailDoDono = user.email
  }

  // ── 2. Payload ────────────────────────────────────────────────────────────
  let body: { referencia?: string; barbeiros?: BarbeiroPayload[]; casa?: CasaPayload }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const referencia = String(body.referencia ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referencia)) return NextResponse.json({ error: 'referencia inválida (YYYY-MM-DD).' }, { status: 400 })
  const barbeirosPayload = Array.isArray(body.barbeiros) ? body.barbeiros : []
  if (barbeirosPayload.length === 0) return NextResponse.json({ error: 'Nenhum barbeiro no payload.' }, { status: 400 })
  const casa = body.casa && typeof body.casa === 'object' ? body.casa : null

  const supabase: Supa = createAdminClient()

  // ── 3. Conta (só minha) + config ──────────────────────────────────────────
  const { data: usuario } = await supabase
    .from('usuarios').select('barbearia_id').eq('email', emailDoDono).maybeSingle()
  const barbeariaId = (usuario as { barbearia_id: string } | null)?.barbearia_id
  if (!barbeariaId) return NextResponse.json({ error: 'Conta configurada não encontrada.' }, { status: 500 })

  const { data: cfg } = await supabase
    .from('barbearias').select('dia_fechamento, modo_meta, base_meta').eq('id', barbeariaId).single()
  const diaFechamento = (cfg?.dia_fechamento as number | null) ?? 1
  const modoMeta = (cfg?.modo_meta ?? 'comissao') as 'faturamento' | 'comissao' | 'ambos'
  const baseMeta = (cfg?.base_meta ?? 'comissao') as 'faturamento' | 'comissao'
  const base: 'faturamento' | 'comissao' = modoMeta === 'ambos' ? baseMeta : (modoMeta as 'faturamento' | 'comissao')

  // ── 4. Ciclo (fuso BR) + trava de mês fechado ─────────────────────────────
  const ciclo = cicloDeData(new Date(referencia + 'T12:00:00'), diaFechamento)
  const mes = ciclo.mesRef, ano = ciclo.anoRef
  const trava = await estaFechado(supabase, barbeariaId, mes, ano)
  if (trava.fechado) return NextResponse.json({ error: `Ciclo ${ciclo.label} está fechado. Reabra pra importar.` }, { status: 409 })

  // ── 5. Conciliação dos nomes (Agenda Serviço → barbeiro do BarberMeta) ────
  //
  // A lista vem SEM filtro de `ativo`, de propósito. Antes ela filtrava por
  // ativo, e com isso um barbeiro DESATIVADO caía no mesmo balaio de quem não
  // tem cadastro nenhum, com a frase "confira o nome" — mandando o dono
  // procurar erro de digitação num nome que estava certo. Agora as duas
  // situações são distinguidas, e a de quem foi EXCLUÍDO também, lendo o
  // rastro de exclusões.
  const { data: barbsRaw } = await supabase
    .from('barbeiros').select('id, nome, ativo').eq('barbearia_id', barbeariaId)
  const barbeiros = (barbsRaw ?? []) as BarbeiroDoBanco[]

  // O rastro de exclusão é informativo: se a tabela ainda não existe no
  // ambiente, o import segue e esses nomes só caem como "sem cadastro".
  const { data: excRaw } = await supabase
    .from('barbeiros_excluidos').select('nome').eq('barbearia_id', barbeariaId)
  const nomesExcluidos = ((excRaw ?? []) as { nome: string }[]).map(e => e.nome)

  // De-para confirmado pelo dono na tela "Importar relatório". Tem precedência
  // sobre o casamento por nome: é decisão explícita contra palpite.
  const { data: deparaRaw } = await supabase
    .from('import_agenda_depara').select('nome_origem, barbeiro_id, ignorar')
    .eq('barbearia_id', barbeariaId)
  const depara = ((deparaRaw ?? []) as { nome_origem: string; barbeiro_id: string | null; ignorar: boolean }[])
    .map(d => ({ nomeOrigem: d.nome_origem, barbeiroId: d.barbeiro_id, ignorar: d.ignorar })) as DeParaConfirmado[]

  const nomesDoRelatorio = barbeirosPayload.map(p => String(p.nome ?? '(sem nome)'))
  const linhas = conciliar(nomesDoRelatorio, barbeiros, nomesExcluidos, depara)

  // Registra os nomes novos como PENDÊNCIA. Sem isto a tela do dono não teria
  // o que listar: só a importação sabe quais nomes o Agenda Serviço manda.
  // `vezes` sobe a cada aparição, pra a tela pôr na frente o que vem todo dia.
  const pendentes = nomesParaRegistrarPendencia(linhas)
  for (const nome of pendentes) {
    const chave = normalizarNome(nome)
    const { data: ja } = await supabase
      .from('import_agenda_depara').select('id, vezes')
      .eq('barbearia_id', barbeariaId).eq('nome_origem', chave).maybeSingle()
    if (ja) {
      await supabase.from('import_agenda_depara')
        .update({ vezes: (Number(ja.vezes) || 0) + 1, visto_em: new Date().toISOString(), nome_exibicao: nome })
        .eq('id', ja.id)
    } else {
      const { error: errPend } = await supabase.from('import_agenda_depara')
        .insert({ barbearia_id: barbeariaId, nome_origem: chave, nome_exibicao: nome })
      // Registrar a pendência é conveniência: se a tabela ainda não existe no
      // ambiente, a importação segue e o nome só aparece na mensagem.
      if (errPend) console.error('[import-agenda] não registrei a pendência de', nome, errPend)
    }
  }

  const atualizados: string[] = []
  const falharam: string[] = []
  let somaFatCasa = 0, somaAtendCasa = 0

  for (let i = 0; i < barbeirosPayload.length; i++) {
    const p = barbeirosPayload[i]
    const linha = linhas[i]
    // 'ativo' (casou pelo nome) e 'confirmado' (o dono ligou os dois à mão)
    // importam igual. O resto já está classificado — pula sem derrubar nada.
    if ((linha.situacao !== 'ativo' && linha.situacao !== 'confirmado') || !linha.barbeiroId) continue

    const alvo = { id: linha.barbeiroId, nome: linha.nomeCadastrado ?? linha.nomeRelatorio }
    const fat = num(p.faturamento)
    const com = num(p.comissao)
    const atend = num(p.atendimentos)
    const espelho = base === 'faturamento' ? fat : com

    // Anti-zerar: se veio tudo zero mas já tem valor gravado, preserva.
    const { data: exist } = await supabase
      .from('lancamentos').select('comissao_acumulada, valor_faturamento, valor_comissao, numero_atendimentos')
      .eq('barbearia_id', barbeariaId).eq('barbeiro_id', alvo.id).eq('mes', mes).eq('ano', ano).maybeSingle()
    const tinha = exist && ((Number(exist.comissao_acumulada) || 0) > 0 || (Number(exist.valor_faturamento) || 0) > 0 || (Number(exist.valor_comissao) || 0) > 0 || (Number(exist.numero_atendimentos) || 0) > 0)
    if (fat === 0 && com === 0 && atend === 0 && tinha) continue

    // Acumulado do ciclo (sobrescreve — igual definirAcumuladoMes).
    const row: Record<string, unknown> = {
      barbearia_id: barbeariaId, barbeiro_id: alvo.id, mes, ano, numero_atendimentos: atend, modo: 'direto',
    }
    if (fat > 0 || base === 'faturamento') row.valor_faturamento = fat
    if (com > 0 || base === 'comissao') row.valor_comissao = com
    row.comissao_acumulada = espelho

    // O ERRO DO UPSERT É CHECADO. Antes não era: uma escrita recusada passava
    // batida e o endpoint respondia "atualizado" para um número que não tinha
    // sido gravado. Reportar sucesso falso é pior que reportar falha.
    const { error: errLanc } = await supabase
      .from('lancamentos').upsert(row, { onConflict: 'barbearia_id,barbeiro_id,mes,ano' })
    if (errLanc) {
      console.error('[import-agenda] falha ao gravar lancamento de', alvo.nome, errLanc)
      falharam.push(alvo.nome)
      continue
    }

    // Foto do dia (sobrescreve o dia se reenviado; não duplica). Se ela
    // falhar, o acumulado — que é o que alimenta ranking e meta — já foi
    // gravado: o barbeiro conta como importado e o erro fica no log.
    const { error: errDia } = await supabase.from('lancamentos_diarios').upsert(
      { barbearia_id: barbeariaId, barbeiro_id: alvo.id, data: referencia, valor: espelho, numero_atendimentos: atend, atualizado_em: new Date().toISOString() },
      { onConflict: 'barbeiro_id,data' },
    )
    if (errDia) console.error('[import-agenda] falha na foto do dia de', alvo.nome, errDia)

    somaFatCasa += fat
    somaAtendCasa += atend
    atualizados.push(alvo.nome)
  }

  // ── 6. Totais da casa (metas) — só se a meta já existe ────────────────────
  const { data: metaRaw } = await supabase
    .from('metas').select('id, faturamento_acumulado, numero_atendimentos')
    .eq('barbearia_id', barbeariaId).eq('mes', mes).eq('ano', ano).maybeSingle()
  if (metaRaw) {
    // Faturamento da casa: prefere o total oficial do Agenda Serviço (casa.faturamento,
    // via endpoint JSON) e cai pra soma dos barbeiros só se ele não veio.
    const fatCasa = casa && num(casa.faturamento) > 0 ? num(casa.faturamento) : somaFatCasa
    const patch: Record<string, number> = {}
    if (fatCasa > 0) patch.faturamento_acumulado = fatCasa
    if (somaAtendCasa > 0) patch.numero_atendimentos = somaAtendCasa
    if (Object.keys(patch).length > 0) await supabase.from('metas').update(patch).eq('id', metaRaw.id)
  }

  const resumo = resumir(linhas, atualizados, falharam)
  const mensagens = mensagensDoResumo(resumo)

  // Nada gravado POR FALHA DE ESCRITA é erro de sistema e sai como erro. Nada
  // gravado por nenhum nome casar é outra coisa: o endpoint funcionou, o
  // cadastro é que não bate — e sai como 200 com a explicação, pra o dono não
  // caçar um problema no servidor que não existe.
  if (tudoFalhouAoGravar(resumo)) {
    return NextResponse.json(
      { error: 'Nada foi gravado: as escritas no banco falharam. Tente de novo em instantes.', resumo, mensagens },
      { status: 502 },
    )
  }

  return NextResponse.json({
    ok: true,
    ciclo: ciclo.label,
    atualizados: atualizados.length,
    barbeiros: atualizados,
    resumo,
    mensagens,
    // Mantido pra não quebrar versões antigas da extensão que ainda leem este
    // campo — agora é a soma das três situações de "não importado".
    naoEncontrados: [...resumo.inativos, ...resumo.excluidos, ...resumo.pendentes],
  })
}
