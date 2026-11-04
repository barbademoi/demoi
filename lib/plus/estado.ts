/**
 * O QUE ESTA CONTA TEM HOJE, E O QUE VAI PASSAR A TER.
 *
 * Lógica pura, sem I/O: recebe a linha de `usuarios` e os grants/licença que
 * já existem, e devolve, módulo por módulo, se está liberado e POR QUAL VIA.
 * É o que a tela do admin mostra antes de confirmar — conceder acesso às
 * cegas, sem ver o antes, é como se apaga o acesso de alguém sem querer.
 *
 * ── POR QUE A RÉGUA ESTÁ DUPLICADA AQUI ─────────────────────────────────────
 * A decisão de verdade é do banco (`plus_ativo()`, migration 061), e é ela que
 * libera ou barra. Este arquivo é um ESPELHO para exibição, e por um motivo
 * concreto: o painel do admin lê as contas com o client de serviço, fora da
 * sessão do mentorado — `plus_ativo()` responde sobre `auth.uid()`, que ali é
 * o admin, não a conta consultada. Não há como perguntar ao banco "e para
 * ESTA conta?" sem reescrever a régua.
 *
 * Duas réguas que discordam viram suporte, então as duas ficam amarradas:
 *   - a parte da assinatura reusa `avaliarAcesso()` de lib/assinatura/acesso,
 *     a mesma função que o resto do app usa;
 *   - a parte do Plus manual está em `plusManualValido()` logo abaixo, e o
 *     teste compara o resultado dela com o da função SQL nos mesmos casos.
 */

import { avaliarAcesso, type ContaAcesso } from '@/lib/assinatura/acesso'
import { MODULOS_PLUS, type ModuloPlusId } from './modulos'

/** O corte do grandfather do Feedback Premiado (migration 027). */
const CORTE_GRANDFATHER_FEEDBACK = Date.parse('2026-06-14T01:00:00Z')

export interface ContaPlus extends ContaAcesso {
  plus_manual: boolean | null
  plus_manual_ate: string | Date | null
}

export interface EvidenciasModulos {
  /** `financeiro_grants.active` do e-mail desta conta. */
  grantFinanceiro: boolean
  /** `feedback_grants.active` do e-mail desta conta. */
  grantFeedback: boolean
  /** `brindoleta_licenses.status = 'active'` da barbearia desta conta. */
  licencaBrindoleta: boolean
  /** `auth.users.created_at` — decide o grandfather do Feedback. */
  contaCriadaEm: string | Date | null
}

export interface EstadoModulo {
  id: ModuloPlusId
  label: string
  liberado: boolean
  /** Como está liberado hoje. null quando não está. */
  via: 'assinatura' | 'plus manual' | 'compra avulsa' | 'licença' | 'grandfather' | null
}

/**
 * A MESMA conta de `plus_manual_conta()` no SQL: a flag ligada e, havendo
 * prazo, o último dia ainda não passou. A comparação é por DATA no fuso de São
 * Paulo — o último dia vale inteiro, e não até a meia-noite de Londres.
 */
export function plusManualValido(
  plusManual: boolean | null,
  ate: string | Date | null,
  agora: Date = new Date(),
): boolean {
  if (!plusManual) return false
  if (!ate) return true
  const fim = ate instanceof Date ? ate : new Date(ate)
  if (isNaN(fim.getTime())) return true
  return diaSP(fim) >= diaSP(agora)
}

/** 'YYYY-MM-DD' no fuso de São Paulo. Comparável como texto. */
function diaSP(d: Date): string {
  // en-CA dá 'YYYY-MM-DD' direto, que é a única formatação que ordena como data.
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/** true se a conta tem direito ao Plus — por assinatura ou por concessão. */
export function temPlus(conta: ContaPlus, agora: Date = new Date()): boolean {
  return assinaturaDaPlus(conta, agora) || plusManualValido(conta.plus_manual, conta.plus_manual_ate, agora)
}

/**
 * A assinatura dá Plus?
 *
 * Espelha `assinatura_ativa_conta()`: só `mensal`, e vitalício NUNCA entra. É
 * exatamente por isso que a cortesia vitalícia ficava sem módulo nenhum — o
 * que esta tela precisa deixar visível para o admin.
 */
export function assinaturaDaPlus(conta: ContaPlus, agora: Date = new Date()): boolean {
  if (conta.tipo_acesso !== 'mensal') return false
  const a = avaliarAcesso(conta, agora)
  // 'ok', 'avisar', 'carencia' e 'revisar' são os estados que o SQL também
  // considera ativos; 'bloqueado' é o único que fecha a porta.
  return a.liberado
}

export function estadoDosModulos(
  conta: ContaPlus,
  ev: EvidenciasModulos,
  agora: Date = new Date(),
): EstadoModulo[] {
  const porAssinatura = assinaturaDaPlus(conta, agora)
  const porManual = plusManualValido(conta.plus_manual, conta.plus_manual_ate, agora)

  const criada = ev.contaCriadaEm
    ? (ev.contaCriadaEm instanceof Date ? ev.contaCriadaEm : new Date(ev.contaCriadaEm))
    : null
  const grandfather = !!criada && !isNaN(criada.getTime()) && criada.getTime() < CORTE_GRANDFATHER_FEEDBACK

  return MODULOS_PLUS.map((m) => {
    // Ordem de precedência na EXIBIÇÃO: a via própria do módulo primeiro, pra
    // que a tela diga "ele já tem por compra avulsa" em vez de prometer que o
    // Plus é o que vai liberar. Revogar o Plus não tira o que veio por compra.
    if (m.id === 'financeiro' && ev.grantFinanceiro) return via(m.id, m.label, 'compra avulsa')
    if (m.id === 'feedback' && ev.grantFeedback) return via(m.id, m.label, 'compra avulsa')
    if (m.id === 'feedback' && grandfather) return via(m.id, m.label, 'grandfather')
    if (m.id === 'brindoleta' && ev.licencaBrindoleta) return via(m.id, m.label, 'licença')
    if (porAssinatura) return via(m.id, m.label, 'assinatura')
    if (porManual) return via(m.id, m.label, 'plus manual')
    return { id: m.id, label: m.label, liberado: false, via: null }
  })
}

function via(id: ModuloPlusId, label: string, v: NonNullable<EstadoModulo['via']>): EstadoModulo {
  return { id, label, liberado: true, via: v }
}

/**
 * O que MUDA se o Plus for concedido agora. Serve pra tela mostrar o
 * "antes → depois" sem o admin ter de deduzir nada.
 */
export function previaConcessao(
  conta: ContaPlus,
  ev: EvidenciasModulos,
  agora: Date = new Date(),
): { antes: EstadoModulo[]; depois: EstadoModulo[]; ganha: string[] } {
  const antes = estadoDosModulos(conta, ev, agora)
  const depois = estadoDosModulos(
    { ...conta, plus_manual: true, plus_manual_ate: null },
    ev,
    agora,
  )
  const ganha = depois
    .filter((d, i) => d.liberado && !antes[i].liberado)
    .map((d) => d.label)
  return { antes, depois, ganha }
}

/**
 * O que a conta PERDE se o Plus manual for revogado.
 *
 * Nunca é "tudo": o que vem de compra avulsa, licença ou grandfather continua,
 * e a tela precisa dizer isso antes de o admin confirmar.
 */
export function previaRevogacao(
  conta: ContaPlus,
  ev: EvidenciasModulos,
  agora: Date = new Date(),
): { antes: EstadoModulo[]; depois: EstadoModulo[]; perde: string[] } {
  const antes = estadoDosModulos(conta, ev, agora)
  const depois = estadoDosModulos(
    { ...conta, plus_manual: false, plus_manual_ate: null },
    ev,
    agora,
  )
  const perde = antes
    .filter((a, i) => a.liberado && !depois[i].liberado)
    .map((a) => a.label)
  return { antes, depois, perde }
}
