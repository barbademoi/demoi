// Helpers compartilhados. Mantido mínimo no app standalone — só o que o
// módulo de ciclo (lib/ciclo.ts) precisa.

export function nomeMes(mes: number): string {
  return new Date(2024, mes - 1, 1).toLocaleString('pt-BR', { month: 'long' })
}
