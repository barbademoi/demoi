/**
 * GATE de TESTE da Brindoleta.
 *
 * Enquanto o dono testa, a Brindoleta fica LIBERADA só pra conta(s) desta
 * allowlist — ninguém mais vê o item no menu, nem abre as telas, nem chama as
 * actions. Constante pura (sem process.env) pra poder importar no client E no
 * server; a validação REAL acontece no servidor (páginas + server actions
 * re-checam este e-mail). Pra abrir pra todo mundo depois, é só remover as
 * checagens (ou trocar pela licença `has_brindoleta`).
 */
export const BRINDOLETA_EMAILS: readonly string[] = [
  'barbeariademoi@gmail.com',
]

export function emailPodeBrindoleta(email: string | null | undefined): boolean {
  if (!email) return false
  return BRINDOLETA_EMAILS.includes(email.trim().toLowerCase())
}
