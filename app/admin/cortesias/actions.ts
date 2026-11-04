'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { TIPOS_COM_VALIDADE } from '@/lib/assinatura/acesso'
import {
  estadoDosModulos, previaConcessao, previaRevogacao, plusManualValido,
  type ContaPlus, type EstadoModulo, type EvidenciasModulos,
} from '@/lib/plus/estado'
import { origemManualValida, type OrigemManual } from '@/lib/plus/modulos'

/**
 * PAINEL DE ACESSO DO ADMIN. Uso exclusivo do dono.
 *
 * PROTEÇÃO NO SERVIDOR (não só na tela): TODA action aqui re-checa que o
 * usuário logado é o e-mail admin (`emailEhAdminCortesia`) antes de qualquer
 * coisa. A página também redireciona, mas a página é só a porta da frente —
 * quem chamar a action direto bate na mesma trava.
 *
 * ── DUAS COISAS DIFERENTES, DOIS BOTÕES ─────────────────────────────────────
 * 1. CONCEDER ACESSO (cortesia vitalícia) — dá LOGIN permanente, fora da régua
 *    de assinatura. É o que já existia. Serve pra criar conta nova de cortesia.
 * 2. LIBERAR PLUS — dá os MÓDULOS (Financeiro, Feedback Premiado, Brindoleta,
 *    chat) a uma conta que já existe, sem tocar no `tipo_acesso` dela.
 *
 * Eram a mesma coisa na cabeça do botão antigo, e não são: o acesso vitalício
 * NÃO dá módulo Plus nenhum, porque `assinatura_ativa()` exige
 * `tipo_acesso = 'mensal'` e devolve false pra todo vitalício (migration 049).
 * Um mentorado com conta de cortesia ficava sem o Financeiro pra sempre. O
 * caminho certo pra ele é o botão 2, e só o 2.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

interface AdminLogado { id: string; email: string }

// Gate server-side: só o(s) e-mail(s) admin passam. Retorna o admin ou null.
async function assertAdmin(): Promise<AdminLogado | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !emailEhAdminCortesia(user.email)) return null
  return { id: user.id, email: (user.email ?? '').toLowerCase() }
}

const SEM_PERMISSAO = 'Sem permissão.'

// A API admin não tem getByEmail — pagina o listUsers até achar ou esgotar.
async function acharAuthUserPorEmail(admin: Admin, email: string) {
  const alvo = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return null
    const achado = (data?.users ?? []).find(
      (u: { email?: string }) => (u.email ?? '').toLowerCase() === alvo,
    )
    if (achado) return achado
    if (!data?.users || data.users.length < 200) break
  }
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Registra no log de auditoria. NUNCA derruba a operação: um log que falha é
 * um problema, mas desfazer uma concessão já aplicada por causa dele seria
 * pior. O erro vai pro console e a ação segue.
 */
async function registrarLog(
  admin: Admin,
  linha: {
    adminLogado: AdminLogado
    usuarioId: string | null
    contaEmail: string
    barbeariaId: string | null
    acao: 'conceder_acesso' | 'conceder_plus' | 'revogar_plus'
    origem?: string | null
    expiraEm?: string | null
    detalhe?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await admin.from('admin_concessoes_log').insert({
    admin_id: linha.adminLogado.id,
    admin_email: linha.adminLogado.email,
    usuario_id: linha.usuarioId,
    conta_email: linha.contaEmail,
    barbearia_id: linha.barbeariaId,
    acao: linha.acao,
    origem: linha.origem ?? null,
    expira_em: linha.expiraEm ?? null,
    detalhe: linha.detalhe ?? {},
  })
  if (error) console.error('[admin/acesso] falha ao gravar auditoria:', error, linha.acao, linha.contaEmail)
}

// ── Busca de conta existente ───────────────────────────────────────────────

/**
 * Colunas que descrevem o acesso de uma conta. Uma linha responde tudo.
 *
 * A LEITURA É TOLERANTE À MIGRATION AUSENTE. As colunas `plus_manual*` chegam
 * pela 061, e migration em produção é aplicada à mão. Entre o deploy do código
 * e o `alter table` existe uma janela — e pedir uma coluna que não existe faz o
 * PostgREST recusar a consulta INTEIRA, não só o campo. Já foi assim que uma
 * tela ficou em branco aqui. Então toda leitura tem plano B sem elas: o painel
 * abre, mostra o acesso que dá pra ler, e só a parte de Plus fica indisponível
 * até a migration rodar.
 */
const COLUNAS_PLUS = 'plus_manual, plus_manual_ate, plus_manual_origem, plus_manual_em'
const COLUNAS_BASE =
  'id, email, barbearia_id, tipo_acesso, origem, status_assinatura, valido_ate, ' +
  'periodicidade, created_at'
const COLUNAS_CONTA = `${COLUNAS_BASE}, ${COLUNAS_PLUS}`

const AVISO_MIGRATION =
  'As colunas do Plus manual não existem no banco ainda — rode a migration 061_plus_manual.sql.'

/**
 * Roda a consulta com as colunas do Plus e, se o banco reclamar delas, repete
 * sem. `faltaMigration` avisa a tela, que esconde os botões de Plus em vez de
 * oferecer um clique que não vai funcionar.
 */
async function comFallback(
  consulta: (colunas: string) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<{ data: unknown; faltaMigration: boolean; error: unknown }> {
  const primeira = await consulta(COLUNAS_CONTA)
  if (!primeira.error) {
    return { data: primeira.data ?? null, faltaMigration: false, error: null }
  }
  const segunda = await consulta(COLUNAS_BASE)
  if (segunda.error) {
    return { data: null, faltaMigration: false, error: primeira.error }
  }
  console.warn('[admin/acesso]', AVISO_MIGRATION)
  return { data: segunda.data ?? null, faltaMigration: true, error: null }
}

interface LinhaUsuario {
  id: string
  email: string
  barbearia_id: string | null
  tipo_acesso: string | null
  origem: string | null
  status_assinatura: string | null
  valido_ate: string | null
  periodicidade: string | null
  plus_manual: boolean | null
  plus_manual_ate: string | null
  plus_manual_origem: string | null
  plus_manual_em: string | null
  created_at: string | null
}

export interface ResumoConta {
  usuarioId: string
  email: string
  barbeariaId: string | null
  barbeariaNome: string
  tipoAcesso: string | null
  origem: string | null
  statusAssinatura: string | null
  validoAte: string | null
  plusManual: boolean
  plusManualAte: string | null
  plusManualOrigem: string | null
  plusManualEm: string | null
  /** O Plus manual está ligado E dentro do prazo. */
  plusManualValendo: boolean
  /** true = a conta é regida por validade (mensal/anual), ou seja, paga. */
  pagante: boolean
}

function resumir(u: LinhaUsuario, nome: string): ResumoConta {
  return {
    usuarioId: u.id,
    email: u.email,
    barbeariaId: u.barbearia_id,
    barbeariaNome: nome,
    tipoAcesso: u.tipo_acesso,
    origem: u.origem,
    statusAssinatura: u.status_assinatura,
    validoAte: u.valido_ate,
    plusManual: !!u.plus_manual,
    plusManualAte: u.plus_manual_ate,
    plusManualOrigem: u.plus_manual_origem,
    plusManualEm: u.plus_manual_em,
    plusManualValendo: plusManualValido(u.plus_manual, u.plus_manual_ate),
    pagante: TIPOS_COM_VALIDADE.has(u.tipo_acesso ?? ''),
  }
}

/**
 * Procura conta por E-MAIL ou por NOME DA BARBEARIA.
 *
 * O termo com '@' é tratado como e-mail (busca parcial, porque o admin digita
 * de memória); sem '@', procura pelo nome da barbearia e devolve os donos
 * dela. O limite de 8 é de propósito: lista longa convida a clicar errado, e
 * conceder acesso na conta errada é o erro mais caro desta tela.
 */
export async function buscarContas(
  termo: string,
): Promise<{ contas: ResumoConta[]; error?: string; faltaMigration?: boolean }> {
  if (!(await assertAdmin())) return { contas: [], error: SEM_PERMISSAO }

  const t = (termo ?? '').trim()
  if (t.length < 3) return { contas: [], error: 'Digite ao menos 3 caracteres.' }

  const admin: Admin = createAdminClient()
  const escapado = t.replace(/[%_]/g, (c) => `\\${c}`)

  let busca: (colunas: string) => PromiseLike<{ data: unknown; error: unknown }>

  if (t.includes('@')) {
    busca = (colunas) => admin
      .from('usuarios').select(colunas)
      .ilike('email', `%${escapado}%`)
      .limit(8)
  } else {
    const { data: barbs, error: errB } = await admin
      .from('barbearias')
      .select('id, nome')
      .ilike('nome', `%${escapado}%`)
      .limit(8)
    if (errB) {
      console.error('[admin/acesso] busca por barbearia:', errB)
      return { contas: [], error: 'Erro ao buscar a barbearia.' }
    }
    const ids = ((barbs ?? []) as { id: string }[]).map((b) => b.id)
    if (ids.length === 0) return { contas: [] }
    busca = (colunas) => admin
      .from('usuarios').select(colunas)
      .in('barbearia_id', ids)
      .limit(8)
  }

  const { data, faltaMigration, error } = await comFallback(busca)
  if (error) {
    console.error('[admin/acesso] busca de conta:', error)
    return { contas: [], error: 'Erro ao buscar a conta.' }
  }

  const linhas = (data ?? []) as LinhaUsuario[]
  const nomes = await nomesDasBarbearias(admin, linhas.map((u) => u.barbearia_id))
  return {
    faltaMigration,
    contas: linhas
      .map((u) => resumir(u, nomes.get(u.barbearia_id ?? '') ?? '—'))
      .sort((a, b) => a.email.localeCompare(b.email, 'pt-BR')),
  }
}

async function nomesDasBarbearias(admin: Admin, ids: (string | null)[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(ids.filter((i): i is string => !!i)))
  const mapa = new Map<string, string>()
  if (unicos.length === 0) return mapa
  const { data } = await admin.from('barbearias').select('id, nome').in('id', unicos)
  for (const b of (data ?? []) as { id: string; nome: string }[]) mapa.set(b.id, b.nome)
  return mapa
}

// ── Detalhe: o que ela tem hoje e o que vai passar a ter ───────────────────

export interface DetalheConta {
  conta: ResumoConta
  /** Estado atual de cada módulo Plus. */
  modulos: EstadoModulo[]
  /** O que a conta GANHA se o Plus for concedido agora. */
  ganhaAoConceder: string[]
  /** O que ela PERDE se o Plus manual for revogado. */
  perdeAoRevogar: string[]
}

export async function detalharConta(
  usuarioId: string,
): Promise<{ detalhe?: DetalheConta; error?: string; faltaMigration?: boolean }> {
  if (!(await assertAdmin())) return { error: SEM_PERMISSAO }
  if (!usuarioId) return { error: 'Conta não informada.' }

  const admin: Admin = createAdminClient()

  const { data: u, faltaMigration, error } = await comFallback((colunas) => admin
    .from('usuarios').select(colunas)
    .eq('id', usuarioId)
    .maybeSingle())

  if (error || !u) {
    console.error('[admin/acesso] detalhe da conta:', error)
    return { error: 'Conta não encontrada.' }
  }
  const linha = u as LinhaUsuario

  const nomes = await nomesDasBarbearias(admin, [linha.barbearia_id])
  const conta = resumir(linha, nomes.get(linha.barbearia_id ?? '') ?? '—')
  const ev = await evidencias(admin, linha)
  const contaPlus = paraContaPlus(linha)

  return {
    faltaMigration,
    detalhe: {
      conta,
      modulos: estadoDosModulos(contaPlus, ev),
      ganhaAoConceder: previaConcessao(contaPlus, ev).ganha,
      perdeAoRevogar: previaRevogacao(contaPlus, ev).perde,
    },
  }
}

function paraContaPlus(u: LinhaUsuario): ContaPlus {
  return {
    tipo_acesso: u.tipo_acesso,
    status_assinatura: u.status_assinatura,
    valido_ate: u.valido_ate,
    plus_manual: u.plus_manual,
    plus_manual_ate: u.plus_manual_ate,
  }
}

/**
 * Lê as vias ALTERNATIVAS de acesso desta conta: grants por e-mail, licença da
 * barbearia e a data de criação no Auth (que decide o grandfather do Feedback).
 *
 * A data vem de `auth.users`, e não de `usuarios.created_at`, porque é essa
 * que `has_feedback()` compara. As duas quase sempre batem, mas "quase" não
 * serve pra uma tela cujo trabalho é dizer a verdade sobre o que a conta tem.
 */
async function evidencias(admin: Admin, u: LinhaUsuario): Promise<EvidenciasModulos> {
  const email = (u.email ?? '').toLowerCase()

  const [fin, fb, lic, authUser] = await Promise.all([
    admin.from('financeiro_grants').select('active').ilike('email', email).maybeSingle(),
    admin.from('feedback_grants').select('active').ilike('email', email).maybeSingle(),
    u.barbearia_id
      ? admin.from('brindoleta_licenses').select('status').eq('barbearia_id', u.barbearia_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.auth.admin.getUserById(u.id).catch(() => ({ data: null })),
  ])

  return {
    grantFinanceiro: fin?.data?.active === true,
    grantFeedback: fb?.data?.active === true,
    licencaBrindoleta: lic?.data?.status === 'active',
    // Sem a data do Auth, cai na da linha de `usuarios` — criadas juntas no
    // cadastro. É só exibição: o banco decide o grandfather por conta própria.
    contaCriadaEm: authUser?.data?.user?.created_at ?? u.created_at,
  }
}

// ── Conceder / revogar PLUS ────────────────────────────────────────────────

export type PlusResult = {
  ok?: boolean
  error?: string
  /** Já estava ligado antes desta chamada — clicar duas vezes não é erro. */
  jaTinha?: boolean
  detalhe?: { email: string; expiraEm: string | null; modulos: string[] }
}

/**
 * LIBERA TODOS OS MÓDULOS PLUS de uma conta existente.
 *
 * O que escreve: a flag `plus_manual` em `usuarios`, mais origem, prazo, quem
 * concedeu e quando. NÃO toca em `tipo_acesso`, `status_assinatura`,
 * `valido_ate`, `origem`, nem nos grants por e-mail — então:
 *
 *   - vitalício continua vitalício, e sem entrar em régua de validade;
 *   - mensal continua mensal, e segue sendo cobrado normalmente;
 *   - nenhum evento da Hotmart remove isto, porque o webhook não escreve em
 *     `plus_manual*`;
 *   - revogar depois devolve a conta ao estado anterior, sem perder dado.
 *
 * Idempotente: conceder duas vezes só atualiza prazo/origem/carimbo, sem
 * duplicar linha nenhuma (é um update, não um insert).
 */
export async function concederPlus(formData: FormData): Promise<PlusResult> {
  const adminLogado = await assertAdmin()
  if (!adminLogado) return { error: SEM_PERMISSAO }

  const usuarioId = ((formData.get('usuarioId') as string) ?? '').trim()
  if (!usuarioId) return { error: 'Conta não informada.' }

  const origemBruta = ((formData.get('origem') as string) ?? 'manual').trim()
  const origem: OrigemManual = origemManualValida(origemBruta) ? origemBruta : 'manual'

  // Validade: vazio = sem prazo (o padrão). Com data, o último dia vale
  // inteiro — grava 23:59:59 no fuso de São Paulo pra que a régua do banco,
  // que compara por DATA, não precise adivinhar a intenção.
  const ateBruto = ((formData.get('expiraEm') as string) ?? '').trim()
  let expiraEm: string | null = null
  if (ateBruto) {
    const iso = fimDoDiaSaoPaulo(ateBruto)
    if (!iso) return { error: 'Data de validade inválida. Use o formato AAAA-MM-DD.' }
    expiraEm = iso
  }

  const admin: Admin = createAdminClient()

  const { data: antes, faltaMigration, error: errLer } = await comFallback((colunas) => admin
    .from('usuarios').select(colunas)
    .eq('id', usuarioId)
    .maybeSingle())

  if (errLer || !antes) {
    console.error('[admin/acesso] conta não encontrada ao conceder plus:', errLer)
    return { error: 'Conta não encontrada.' }
  }
  // Sem as colunas, o update abaixo falharia com uma mensagem de banco que não
  // diz o que fazer. Melhor parar aqui e nomear a migration.
  if (faltaMigration) return { error: AVISO_MIGRATION }

  const linha = antes as LinhaUsuario
  const jaTinha = plusManualValido(linha.plus_manual, linha.plus_manual_ate)

  const ev = await evidencias(admin, linha)
  const previa = previaConcessao(paraContaPlus(linha), ev)

  const { error } = await admin
    .from('usuarios')
    .update({
      plus_manual: true,
      plus_manual_ate: expiraEm,
      plus_manual_origem: origem,
      plus_manual_por: adminLogado.id,
      plus_manual_em: new Date().toISOString(),
    })
    .eq('id', usuarioId)

  if (error) {
    console.error('[admin/acesso] erro ao conceder plus:', error)
    return { error: 'Erro ao liberar os módulos Plus.' }
  }

  await registrarLog(admin, {
    adminLogado,
    usuarioId,
    contaEmail: linha.email,
    barbeariaId: linha.barbearia_id,
    acao: 'conceder_plus',
    origem,
    expiraEm,
    detalhe: {
      ja_tinha: jaTinha,
      tipo_acesso: linha.tipo_acesso,
      modulos_ganhos: previa.ganha,
    },
  })

  console.log('[admin/acesso] plus manual concedido:', linha.email, origem, expiraEm ?? 'sem prazo')
  revalidatePath('/admin/cortesias')
  return {
    ok: true,
    jaTinha,
    detalhe: { email: linha.email, expiraEm, modulos: previa.ganha },
  }
}

/**
 * REVOGA só o Plus manual.
 *
 * Desliga a flag e limpa prazo/origem/carimbo. Não mexe em `tipo_acesso`, não
 * mexe em assinatura, não mexe em grant comprado: quem tem o Financeiro por
 * compra avulsa continua com ele depois disto. Nenhum dado da conta — meta,
 * barbeiro, lançamento, histórico — é tocado.
 */
export async function revogarPlus(formData: FormData): Promise<PlusResult> {
  const adminLogado = await assertAdmin()
  if (!adminLogado) return { error: SEM_PERMISSAO }

  const usuarioId = ((formData.get('usuarioId') as string) ?? '').trim()
  if (!usuarioId) return { error: 'Conta não informada.' }

  const admin: Admin = createAdminClient()

  const { data: antes, faltaMigration, error: errLer } = await comFallback((colunas) => admin
    .from('usuarios').select(colunas)
    .eq('id', usuarioId)
    .maybeSingle())

  if (errLer || !antes) {
    console.error('[admin/acesso] conta não encontrada ao revogar plus:', errLer)
    return { error: 'Conta não encontrada.' }
  }
  if (faltaMigration) return { error: AVISO_MIGRATION }

  const linha = antes as LinhaUsuario
  const tinha = !!linha.plus_manual

  const ev = await evidencias(admin, linha)
  const previa = previaRevogacao(paraContaPlus(linha), ev)

  const { error } = await admin
    .from('usuarios')
    .update({
      plus_manual: false,
      plus_manual_ate: null,
      plus_manual_origem: null,
      plus_manual_por: null,
      plus_manual_em: null,
    })
    .eq('id', usuarioId)

  if (error) {
    console.error('[admin/acesso] erro ao revogar plus:', error)
    return { error: 'Erro ao revogar o Plus.' }
  }

  await registrarLog(admin, {
    adminLogado,
    usuarioId,
    contaEmail: linha.email,
    barbeariaId: linha.barbearia_id,
    acao: 'revogar_plus',
    origem: linha.plus_manual_origem,
    detalhe: {
      tinha_plus_manual: tinha,
      tipo_acesso: linha.tipo_acesso,
      modulos_perdidos: previa.perde,
    },
  })

  console.log('[admin/acesso] plus manual revogado:', linha.email)
  revalidatePath('/admin/cortesias')
  return {
    ok: true,
    jaTinha: tinha,
    detalhe: { email: linha.email, expiraEm: null, modulos: previa.perde },
  }
}

/**
 * 'AAAA-MM-DD' → o FIM daquele dia no fuso de São Paulo, em ISO.
 *
 * Gravar meia-noite faria o último dia não valer; gravar o dia em UTC faria a
 * cortesia vencer três horas antes pra quem está no Brasil. O offset de -03:00
 * é fixo desde o fim do horário de verão (2019), e a régua do banco compara
 * por data no fuso de São Paulo de qualquer forma — então o que importa aqui é
 * só cair dentro do dia certo, com folga nas duas pontas.
 */
function fimDoDiaSaoPaulo(aaaaMmDd: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(aaaaMmDd)) return null
  const d = new Date(`${aaaaMmDd}T23:59:59-03:00`)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

// ── Conceder ACESSO (cortesia vitalícia) ───────────────────────────────────

export type ConcederResult = {
  ok?: boolean
  error?: string
  jaExistia?: boolean
  /**
   * A conta é PAGANTE (mensal/anual) e virar vitalícia mudaria o tipo de
   * acesso dela. Exige segunda confirmação do admin — ver o comentário na
   * action.
   */
  precisaConfirmar?: boolean
  detalhe?: { email: string; tipoAtual?: string | null; usuarioId?: string }
}

export async function concederAcesso(formData: FormData): Promise<ConcederResult> {
  const adminLogado = await assertAdmin()
  if (!adminLogado) return { error: SEM_PERMISSAO }

  const email = ((formData.get('email') as string) ?? '').toLowerCase().trim()
  if (!email || !EMAIL_RE.test(email)) return { error: 'Informe um e-mail válido.' }
  const confirmarTroca = formData.get('confirmarTroca') === 'sim'

  const admin: Admin = createAdminClient()

  // ── 1) Já existe conta com esse e-mail? Só (re)marca cortesia — sem duplicar ─
  const { data: usuarioExistente } = await admin
    .from('usuarios')
    .select('id, barbearia_id, tipo_acesso, origem')
    .eq('email', email)
    .maybeSingle()

  if (usuarioExistente) {
    const atual = usuarioExistente as {
      id: string; barbearia_id: string | null; tipo_acesso: string | null; origem: string | null
    }
    const pagante = TIPOS_COM_VALIDADE.has(atual.tipo_acesso ?? '')

    // CONTA QUE PAGA NÃO VIRA CORTESIA POR ACIDENTE.
    //
    // Até aqui esta action escrevia `tipo_acesso='vitalicio'` em qualquer
    // conta: um assinante mensal clicado por engano passava a ter o sistema
    // de graça pra sempre, e `origem` virava 'cortesia' por cima do
    // 'hotmart:<produto>' — apagando o rastro da venda.
    //
    // Agora a troca de tipo pede confirmação explícita. E, pra liberar os
    // MÓDULOS de quem já paga, o caminho certo não é este botão: é "Liberar
    // Plus", que não encosta no tipo de acesso.
    if (pagante && !confirmarTroca) {
      return {
        precisaConfirmar: true,
        detalhe: { email, tipoAtual: atual.tipo_acesso, usuarioId: atual.id },
      }
    }

    const patch: Record<string, unknown> = { tipo_acesso: 'vitalicio' }
    // `origem` só é escrita quando está vazia. Ela é o rastro de ONDE a conta
    // veio; sobrescrever um 'hotmart:...' com 'cortesia' é perder informação
    // que não se recupera.
    if (!atual.origem) patch.origem = 'cortesia'

    const { error } = await admin.from('usuarios').update(patch).eq('id', atual.id)
    if (error) {
      console.error('[cortesias] erro ao remarcar cortesia:', error)
      return { error: 'Erro ao marcar a conta como cortesia.' }
    }

    await registrarLog(admin, {
      adminLogado,
      usuarioId: atual.id,
      contaEmail: email,
      barbeariaId: atual.barbearia_id,
      acao: 'conceder_acesso',
      origem: 'cortesia',
      detalhe: {
        ja_existia: true,
        tipo_anterior: atual.tipo_acesso,
        origem_preservada: atual.origem ?? null,
        troca_confirmada: pagante ? confirmarTroca : false,
      },
    })

    console.log('[cortesias] já existia — remarcada como cortesia vitalícia:', email)
    revalidatePath('/admin/cortesias')
    return { ok: true, jaExistia: true, detalhe: { email, usuarioId: atual.id } }
  }

  // ── 2) Não existe → cria (ou reaproveita) o Auth user, já confirmado ────────
  // Senha aleatória descartável: ninguém a usa — a pessoa entra por "esqueci
  // minha senha" pra definir a dela.
  const senhaDescartavel = randomUUID() + randomUUID()
  let userId: string
  let reaproveitou = false

  const { data: authData, error: errAuth } = await admin.auth.admin.createUser({
    email,
    password: senhaDescartavel,
    email_confirm: true,
  })

  if (errAuth || !authData?.user) {
    // Provável: e-mail já existe no Auth (criado à mão). Reaproveita e confirma.
    const existente = await acharAuthUserPorEmail(admin, email)
    if (!existente) {
      console.error('[cortesias] erro ao criar auth user:', errAuth)
      return { error: 'Erro ao criar o usuário no Auth.' }
    }
    const { error: errUpd } = await admin.auth.admin.updateUserById(existente.id, { email_confirm: true })
    if (errUpd) {
      console.error('[cortesias] erro ao confirmar auth user existente:', errUpd)
      return { error: 'Erro ao confirmar o usuário no Auth.' }
    }
    userId = existente.id
    reaproveitou = true
  } else {
    userId = authData.user.id
  }

  // ── 3) Cria a barbearia (entra no onboarding no primeiro acesso) ────────────
  const { data: barbearia, error: errBarbearia } = await admin
    .from('barbearias')
    .insert({ nome: 'Barbearia (cortesia)', onboarding_completo: false })
    .select('id')
    .single()

  if (errBarbearia || !barbearia) {
    console.error('[cortesias] erro ao criar barbearia:', errBarbearia)
    if (!reaproveitou) await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao criar a barbearia.' }
  }
  const barbeariaId = (barbearia as { id: string }).id

  // ── 4) Cria a linha em usuarios — vitalício/cortesia, SEM Hotmart ───────────
  // senha_definida=true + senha_temporaria=false → sem reset obrigatório; a
  // pessoa define a senha via recuperação e loga direto pro onboarding.
  const { error: errUsuario } = await admin
    .from('usuarios')
    .insert({
      id: userId,
      barbearia_id: barbeariaId,
      email,
      senha_definida: true,
      senha_temporaria: false,
      tipo_acesso: 'vitalicio',
      origem: 'cortesia',
    })

  if (errUsuario) {
    console.error('[cortesias] erro ao criar usuario:', errUsuario)
    await admin.from('barbearias').delete().eq('id', barbeariaId)
    if (!reaproveitou) await admin.auth.admin.deleteUser(userId)
    return { error: 'Erro ao vincular a conta à barbearia.' }
  }

  await registrarLog(admin, {
    adminLogado,
    usuarioId: userId,
    contaEmail: email,
    barbeariaId,
    acao: 'conceder_acesso',
    origem: 'cortesia',
    detalhe: { ja_existia: false, auth_reaproveitado: reaproveitou },
  })

  console.log('[cortesias] acesso de cortesia vitalícia concedido:', email, reaproveitou ? '(auth reaproveitado)' : '')
  revalidatePath('/admin/cortesias')
  return { ok: true, jaExistia: false, detalhe: { email, usuarioId: userId } }
}

// ── Listagens do painel ────────────────────────────────────────────────────

export type Cortesia = { email: string; created_at: string }

export async function listarCortesias(): Promise<{ cortesias: Cortesia[]; error?: string }> {
  if (!(await assertAdmin())) return { cortesias: [], error: SEM_PERMISSAO }
  const admin: Admin = createAdminClient()
  const { data } = await admin
    .from('usuarios')
    .select('email, created_at')
    .eq('origem', 'cortesia')
    .order('created_at', { ascending: false })
  return { cortesias: (data ?? []) as Cortesia[] }
}

export type PlusManualAtivo = {
  usuarioId: string
  email: string
  origem: string | null
  concedidoEm: string | null
  expiraEm: string | null
  valendo: boolean
}

/** Quem está com Plus manual ligado — pra o admin ver e poder revogar. */
export async function listarPlusManual(): Promise<{ contas: PlusManualAtivo[]; error?: string }> {
  if (!(await assertAdmin())) return { contas: [], error: SEM_PERMISSAO }
  const admin: Admin = createAdminClient()

  const { data, error } = await admin
    .from('usuarios')
    .select('id, email, plus_manual, plus_manual_ate, plus_manual_origem, plus_manual_em')
    .eq('plus_manual', true)
    .order('plus_manual_em', { ascending: false })

  // A coluna chega pela migration 061. Entre o deploy e o `alter table` existe
  // uma janela, e pedir uma coluna que não existe derruba a consulta INTEIRA —
  // foi assim que o dashboard já ficou sem carregar uma vez. Sem a coluna, a
  // lista vem vazia, que é exatamente o estado de antes.
  if (error) {
    console.error('[admin/acesso] listarPlusManual (migration 061 aplicada?):', error)
    return { contas: [] }
  }

  type L = {
    id: string; email: string; plus_manual: boolean
    plus_manual_ate: string | null; plus_manual_origem: string | null; plus_manual_em: string | null
  }
  return {
    contas: ((data ?? []) as L[]).map((u) => ({
      usuarioId: u.id,
      email: u.email,
      origem: u.plus_manual_origem,
      concedidoEm: u.plus_manual_em,
      expiraEm: u.plus_manual_ate,
      valendo: plusManualValido(u.plus_manual, u.plus_manual_ate),
    })),
  }
}
