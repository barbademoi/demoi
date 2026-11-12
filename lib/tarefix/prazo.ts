import { agoraSP, FUSO, minutosDeHorario } from '@/lib/tarefix/datas'

/**
 * Fluxo do dia: hora de começar, tempo estimado e prazo das tarefas.
 *
 *  - horario_inicio      "começar às HH:MM"
 *  - tempo_estimado_min  quanto costuma levar
 *  - horario_limite      "fazer até HH:MM" (opcional)
 *
 * Prazo efetivo = "fazer até" se houver; senão início + tempo estimado.
 * Passou do prazo efetivo sem fazer → atrasada. Atraso é só informativo:
 * não muda o percentual do dia.
 */

type Horarios = { horario_inicio?: string | null; horario_limite: string | null; tempo_estimado_min?: number | null }
type ComStatus = Horarios & { status: 'pendente' | 'feita' | 'reprovada'; feita_em: string | null }

/** '09:00:00' → '09:00' */
export function horarioHHMM(h: string | null | undefined): string | null {
  return h ? h.slice(0, 5) : null
}

/** minutos do dia → 'HH:MM' (limitado ao mesmo dia) */
function hhmm(min: number): string {
  const m = Math.max(0, Math.min(23 * 60 + 59, min))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** 15 → '~15 min' · 80 → '~1h20' · 60 → '~1h' */
export function duracao(min: number | null | undefined): string | null {
  if (!min || min <= 0) return null
  if (min < 60) return `~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `~${h}h${String(m).padStart(2, '0')}` : `~${h}h`
}

/** Fim previsto = início + tempo estimado (ou null). */
export function fimPrevisto(t: Horarios): string | null {
  if (!t.horario_inicio || !t.tempo_estimado_min) return null
  return hhmm(minutosDeHorario(t.horario_inicio) + t.tempo_estimado_min)
}

/** Prazo usado para marcar atraso: "fazer até" ou, sem ele, o fim previsto. */
export function prazoEfetivo(t: Horarios): string | null {
  return horarioHHMM(t.horario_limite) ?? fimPrevisto(t)
}

/** Texto curto do horário: '09:00–09:15', 'às 09:00', 'até 10:00', '09:00 · até 10:30'. */
export function janela(t: Horarios): string | null {
  const ini = horarioHHMM(t.horario_inicio)
  const lim = horarioHHMM(t.horario_limite)
  const fim = fimPrevisto(t)
  if (ini && lim) return `${ini} · até ${lim}`
  if (ini && fim) return `${ini}–${fim}`
  if (ini) return `às ${ini}`
  if (lim) return `até ${lim}`
  return null
}

/** Ainda não feita e o prazo efetivo já passou (no próprio dia ou em dias passados). */
export function estaAtrasada(t: ComStatus, data: string, ref: Date = new Date()): boolean {
  const prazo = prazoEfetivo(t)
  if (!prazo || t.status === 'feita') return false
  const agora = agoraSP(ref)
  if (data < agora.data) return true
  if (data > agora.data) return false
  return agora.minutosDoDia > minutosDeHorario(prazo)
}

/** É a vez desta tarefa: pendente, hoje, já passou da hora de começar e ainda não do prazo. */
export function eAgora(t: ComStatus, data: string, ref: Date = new Date()): boolean {
  if (!t.horario_inicio || t.status === 'feita') return false
  const agora = agoraSP(ref)
  if (data !== agora.data) return false
  if (agora.minutosDoDia < minutosDeHorario(t.horario_inicio)) return false
  const prazo = prazoEfetivo(t)
  return !prazo || agora.minutosDoDia <= minutosDeHorario(prazo)
}

/** Feita depois do prazo efetivo: minutos de atraso (ou 0). */
export function minutosDeAtraso(t: ComStatus): number {
  const prazo = prazoEfetivo(t)
  if (!prazo || !t.feita_em || t.status === 'pendente') return 0
  return Math.max(0, agoraSP(new Date(t.feita_em)).minutosDoDia - minutosDeHorario(prazo))
}

/**
 * Ordem do fluxo: pelo horário de referência (início; sem início, o prazo),
 * mais cedo antes; sem horário vai depois, na ordem que o dono arrastou.
 */
export function ordenarPorPrazo<T extends Horarios & { ordem?: number; titulo: string }>(lista: T[]): T[] {
  const ref = (t: T) => horarioHHMM(t.horario_inicio) ?? horarioHHMM(t.horario_limite)
  return [...lista].sort((a, b) => {
    const ra = ref(a)
    const rb = ref(b)
    if (ra && rb && ra !== rb) return ra < rb ? -1 : 1
    if (ra && !rb) return -1
    if (!ra && rb) return 1
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
