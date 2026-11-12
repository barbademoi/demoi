import { agoraSP, FUSO, minutosDeHorario } from '@/lib/tarefix/datas'

/**
 * Prazo ("fazer até HH:MM") e tempo estimado das tarefas.
 * O atraso é só informativo: não muda o percentual do dia.
 */

/** '09:00:00' → '09:00' */
export function horarioHHMM(h: string | null | undefined): string | null {
  return h ? h.slice(0, 5) : null
}

/** 15 → '~15 min' · 80 → '~1h20' · 60 → '~1h' */
export function duracao(min: number | null | undefined): string | null {
  if (!min || min <= 0) return null
  if (min < 60) return `~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `~${h}h${String(m).padStart(2, '0')}` : `~${h}h`
}

/** Minutos do dia (SP) em que a tarefa foi marcada. */
function minutosFeita(feitaEm: string): number {
  return agoraSP(new Date(feitaEm)).minutosDoDia
}

type ComPrazo = { horario_limite: string | null; status: 'pendente' | 'feita' | 'reprovada'; feita_em: string | null }

/** Ainda não feita e o prazo já passou (só faz sentido no próprio dia ou em dias passados). */
export function estaAtrasada(t: ComPrazo, data: string, ref: Date = new Date()): boolean {
  if (!t.horario_limite || t.status === 'feita') return false
  const agora = agoraSP(ref)
  if (data < agora.data) return true
  if (data > agora.data) return false
  return agora.minutosDoDia > minutosDeHorario(t.horario_limite)
}

/** Feita depois do prazo: minutos de atraso (ou 0). */
export function minutosDeAtraso(t: ComPrazo): number {
  if (!t.horario_limite || !t.feita_em || t.status === 'pendente') return 0
  return Math.max(0, minutosFeita(t.feita_em) - minutosDeHorario(t.horario_limite))
}

/** Ordem de exibição: com prazo primeiro (mais cedo antes), depois a ordem definida pelo dono. */
export function ordenarPorPrazo<T extends { horario_limite: string | null; ordem?: number; titulo: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    if (a.horario_limite && b.horario_limite && a.horario_limite !== b.horario_limite) return a.horario_limite < b.horario_limite ? -1 : 1
    if (a.horario_limite && !b.horario_limite) return -1
    if (!a.horario_limite && b.horario_limite) return 1
    return (a.ordem ?? 0) - (b.ordem ?? 0) || a.titulo.localeCompare(b.titulo)
  })
}

export const horaSPDe = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

/** Valida 'HH:MM' vindo de formulário. Vazio → null. Inválido → undefined. */
export function lerHorario(v: string | null | undefined): string | null | undefined {
  const s = (v ?? '').trim()
  if (!s) return null
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s.slice(0, 5)) ? s.slice(0, 5) : undefined
}

/** Valida minutos vindos de formulário. Vazio → null. Inválido → undefined. */
export function lerMinutos(v: number | string | null | undefined): number | null | undefined {
  if (v === null || v === undefined || v === '') return null
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 1 && n <= 600 ? n : undefined
}
