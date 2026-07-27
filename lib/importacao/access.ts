/**
 * IMPORTAÇÃO DE LANÇAMENTOS — funcionalidade em teste.
 *
 * A allowlist controla a exibição no client, mas a trava real também é
 * repetida na página e em todas as server actions.
 */
export const IMPORTACAO_PREVIEW_EMAILS: readonly string[] = [
  'barbeariademoi@gmail.com',
]

export function emailTemImportacao(email: string | null | undefined): boolean {
  if (!email) return false
  return IMPORTACAO_PREVIEW_EMAILS.includes(email.trim().toLowerCase())
}
