/**
 * Acesso ao MÓDULO DE REUNIÃO — PREVIEW / PLUS.
 *
 * Por enquanto é restrito à(s) conta(s) do dono (allowlist por e-mail). Nasce
 * DESLIGADO pra todo mundo e habilitado só pra quem está aqui.
 *
 * FLAG PREPARADA PRA VIRAR VENDÁVEL: quando quiser abrir como item comprável,
 * é só trocar `emailTemReuniao` por uma checagem de grant (tabela
 * `reuniao_grants` + função `has_reuniao()`), no mesmo molde de Feedback e
 * Financeiro (migrations 027/029). A allowlist continua valendo como override
 * interno/preview.
 *
 * Constante pura (sem process.env) — segura pra importar no client E no server;
 * a validação REAL acontece no servidor (página + actions), a allowlist no
 * client é só pra mostrar/esconder o item no menu.
 */
export const REUNIAO_PREVIEW_EMAILS: readonly string[] = [
  'barbeariademoi@gmail.com',
]

export function emailTemReuniao(email: string | null | undefined): boolean {
  if (!email) return false
  return REUNIAO_PREVIEW_EMAILS.includes(email.trim().toLowerCase())
}
