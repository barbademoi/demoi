/**
 * OS MÓDULOS PLUS — a lista única.
 *
 * Existe para que incluir um módulo Plus novo seja UMA linha, e para que a
 * tela de concessão do admin nunca mostre uma lista desatualizada do que a
 * conta vai receber.
 *
 * ── COMO O PLUS É LIGADO ────────────────────────────────────────────────────
 * Não é por módulo. Os quatro abrem pela MESMA função do banco, `plus_ativo()`
 * (migration 061), que é a união de duas portas:
 *
 *     plus_ativo()  =  assinatura_ativa()  or  plus_manual_ativo()
 *
 * Então conceder o Plus à mão é ligar UMA flag em `usuarios` — não escrever em
 * `financeiro_grants`, `feedback_grants` e `brindoleta_licenses` uma por uma.
 * Isso tem três consequências que valem o desenho:
 *
 *   1. REVOGAR é um lugar só. Antes seria caçar linha em três tabelas, com
 *      chaves diferentes (e-mail numa, barbearia na outra).
 *   2. O WEBHOOK DA HOTMART NÃO ALCANÇA. Ele mexe em tipo_acesso, status,
 *      validade e nos grants por e-mail. `plus_manual` não é nenhum desses, e
 *      nenhum evento dele escreve ali — nem compra, nem cancelamento, nem
 *      reembolso, nem expiração.
 *   3. MÓDULO NOVO entra com `or public.plus_ativo()` no gate dele e uma
 *      entrada nesta lista. Nada mais.
 *
 * ── O QUE NÃO ESTÁ AQUI ─────────────────────────────────────────────────────
 * A Reunião, que hoje é PREVIEW por allowlist de e-mail em
 * `lib/reuniao/preview.ts` — não é vendida, então não é Plus. Quando virar
 * vendável, entra nesta lista e ganha o mesmo `or`.
 */

export type ModuloPlusId = 'financeiro' | 'feedback' | 'brindoleta' | 'chat'

export interface ModuloPlus {
  id: ModuloPlusId
  /** Nome como aparece no menu do dono. */
  label: string
  /** Uma linha sobre o que o módulo faz — a tela de confirmação mostra. */
  resumo: string
  /**
   * Caminhos ALTERNATIVOS de acesso, além do Plus. É o que explica uma conta
   * que já tem o módulo sem ter Plus nenhum — compra avulsa, licença, ou o
   * grandfather do Feedback. A tela usa para não prometer liberar o que a
   * pessoa já tem por outra via.
   */
  outrasVias: string[]
}

export const MODULOS_PLUS: readonly ModuloPlus[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    resumo: 'Caixa, contas a pagar, importação de comissão, folha e comprovantes',
    outrasVias: ['grant por e-mail (compra avulsa ou combo Plus)'],
  },
  {
    id: 'feedback',
    label: 'Feedback Premiado',
    resumo: 'Link público de avaliação, brindes sorteados e direcionamento pro Google',
    outrasVias: ['grant por e-mail', 'conta criada antes de 14/06/2026 (grandfather)'],
  },
  {
    id: 'brindoleta',
    label: 'Brindoleta',
    resumo: 'Roleta de brindes com QR Code pro cliente final',
    outrasVias: ['licença avulsa ativa da barbearia'],
  },
  {
    id: 'chat',
    label: 'Chat',
    resumo: 'Comunicados e suporte 1-a-1 com o BarberMeta',
    outrasVias: [],
  },
] as const

export const LABELS_PLUS: string = MODULOS_PLUS.map((m) => m.label).join(', ')

/** Origens possíveis de uma concessão manual. Espelha o check da migration 061. */
export const ORIGENS_MANUAIS = ['manual', 'mentoria'] as const
export type OrigemManual = (typeof ORIGENS_MANUAIS)[number]

export function origemManualValida(v: unknown): v is OrigemManual {
  return typeof v === 'string' && (ORIGENS_MANUAIS as readonly string[]).includes(v)
}
