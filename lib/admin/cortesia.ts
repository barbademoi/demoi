/**
 * GATE do recurso "CONCEDER ACESSO" (cortesia).
 *
 * Restrito por allowlist de e-mail — nasce DESLIGADO pra todo mundo e habilitado
 * só pra conta do dono. Constante pura (sem process.env) pra poder importar no
 * client E no server: a validação REAL acontece SEMPRE no servidor (página +
 * server actions re-checam este e-mail); a allowlist no client é só pra
 * mostrar/esconder o link no menu.
 */
export const ADMIN_CORTESIA_EMAILS: readonly string[] = [
  'barbeariademoi@gmail.com',
]

export function emailEhAdminCortesia(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_CORTESIA_EMAILS.includes(email.trim().toLowerCase())
}
