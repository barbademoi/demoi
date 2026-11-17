/** Período opcional de uma recorrente: só vale de `inicio` até `fim` (inclusive). */
export function valeNoDia(m: { inicio?: string | null; fim?: string | null }, data: string): boolean {
  if (m.inicio && data < m.inicio) return false
  if (m.fim && data > m.fim) return false
  return true
}

const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

/** "a partir de 01/12", "até 24/12", "de 01/12 a 24/12" ou null. */
export function textoPeriodo(m: { inicio?: string | null; fim?: string | null }, hoje?: string): string | null {
  const ini = m.inicio && (!hoje || m.inicio > hoje) ? m.inicio : null
  if (ini && m.fim) return `de ${dm(ini)} a ${dm(m.fim)}`
  if (ini) return `a partir de ${dm(ini)}`
  if (m.fim) return hoje && m.fim < hoje ? `terminou em ${dm(m.fim)}` : `até ${dm(m.fim)}`
  return null
}
