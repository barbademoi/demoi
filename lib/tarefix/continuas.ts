import { minutosDeHorario } from '@/lib/tarefix/datas'

/**
 * Tarefas do dia todo (atendimento, comandas, verificar algo…):
 * ficam fixas no topo e o check só libera X minutos antes do fechamento.
 * Ao confirmar, o colaborador se autoavalia (1..5) — não entra no percentual.
 */

/** Horário 'HH:MM' em que o check das tarefas do dia todo é liberado. */
export function liberacaoContinuas(horarioFechamento: string, minutosAntes: number): string {
  const m = Math.max(0, minutosDeHorario(horarioFechamento) - Math.max(0, minutosAntes))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Escala da autoavaliação (a "setinha"). */
export const AUTOAVALIACAO = [
  { valor: 1, rotulo: 'Difícil' },
  { valor: 2, rotulo: 'Fraco' },
  { valor: 3, rotulo: 'Ok' },
  { valor: 4, rotulo: 'Bom' },
  { valor: 5, rotulo: 'Excelente' },
] as const

export function rotuloAutoavaliacao(v: number | null | undefined): string | null {
  return AUTOAVALIACAO.find((a) => a.valor === v)?.rotulo ?? null
}
