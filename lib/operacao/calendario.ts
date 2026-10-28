/**
 * CALENDÁRIO DE OPERAÇÃO — em que dias esta barbearia abre.
 *
 * Nasceu de uma acusação falsa. O aviso "5 dias sem registro neste ciclo"
 * estava contando os 4 domingos e o feriado de 12/10 — dias em que a
 * barbearia estava fechada. Dia fechado não é lacuna; é folga. Nenhum sistema
 * deveria cobrar faturamento de domingo.
 *
 * ── TRÊS FONTES, NESTA ORDEM ────────────────────────────────────────────────
 *   1. DIA DA SEMANA — `barbearias.dias_trabalhados`, que o dono já preenche
 *      em Configurações → Operação. Domingo desmarcado ⇒ todo domingo fecha.
 *   2. FERIADO NACIONAL — calculado em `lib/feriados`, sem rede. Ninguém vai
 *      cadastrar 12 de outubro todo ano.
 *   3. EXCEÇÃO DO MÊS — `barbearias.dias_fechados`, a lista de datas que o
 *      dono marcou à mão no calendário. Tem a ÚLTIMA palavra nos dois
 *      sentidos: fecha um dia que seria aberto, e reabre um feriado em que
 *      ele decidiu trabalhar.
 *
 * A ordem importa: sem a exceção vencendo o feriado, a barbearia que abre na
 * Sexta-feira Santa seria marcada como fechada contra a vontade dela.
 *
 * Só leitura, sem I/O. Datas em 'YYYY-MM-DD', fuso de São Paulo resolvido por
 * quem chama.
 */
import { feriadosNoIntervalo, type Feriado } from '@/lib/feriados'

/** Índice de `Date.getDay()` (0 = domingo) para a chave usada no cadastro. */
const CHAVE_DIA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

export interface ConfigOperacao {
  /** `barbearias.dias_trabalhados`. null/vazio = abre todo dia (legado). */
  diasTrabalhados: { dia: string; ativo: boolean }[] | null
  /** `barbearias.dias_fechados`: datas marcadas à mão. */
  fechadosManuais: string[]
  /** Datas que o dono reabriu apesar de feriado. */
  abertosManuais?: string[]
  /** false = ignora o calendário de feriados (barbearia que abre em feriado). */
  consideraFeriados?: boolean
}

export type MotivoFechado = 'semana' | 'feriado' | 'manual'

export interface DiaOperacao {
  data: string
  aberto: boolean
  motivo: MotivoFechado | null
  feriado: Feriado | null
}

function abrePorDiaDaSemana(iso: string, cfg: ConfigOperacao): boolean {
  if (!cfg.diasTrabalhados || cfg.diasTrabalhados.length === 0) return true
  // Meio-dia: evita a data escorregar um dia por fuso.
  const d = new Date(`${iso}T12:00:00`)
  const chave = CHAVE_DIA[d.getDay()]
  const item = cfg.diasTrabalhados.find((x) => x.dia === chave)
  // Dia da semana não cadastrado é tratado como aberto — na dúvida, não
  // silencia um dia de trabalho real.
  return item ? item.ativo : true
}

/** O dia está aberto, e por quê não (quando fechado). */
export function diaDeOperacao(iso: string, cfg: ConfigOperacao, feriados: Map<string, Feriado>): DiaOperacao {
  const feriado = feriados.get(iso) ?? null

  // A decisão manual vem primeiro: é a única explícita sobre ESTA data.
  if (cfg.abertosManuais?.includes(iso)) {
    return { data: iso, aberto: true, motivo: null, feriado }
  }
  if (cfg.fechadosManuais.includes(iso)) {
    return { data: iso, aberto: false, motivo: 'manual', feriado }
  }
  if (!abrePorDiaDaSemana(iso, cfg)) {
    return { data: iso, aberto: false, motivo: 'semana', feriado }
  }
  if (cfg.consideraFeriados !== false && feriado && !feriado.facultativo) {
    return { data: iso, aberto: false, motivo: 'feriado', feriado }
  }
  return { data: iso, aberto: true, motivo: null, feriado }
}

/** Todos os dias de um intervalo, classificados. */
export function calendarioDoPeriodo(
  inicioIso: string,
  fimIso: string,
  cfg: ConfigOperacao,
): DiaOperacao[] {
  const feriados = feriadosNoIntervalo(inicioIso, fimIso)
  const out: DiaOperacao[] = []
  const cursor = new Date(`${inicioIso}T12:00:00`)
  const fim = new Date(`${fimIso}T12:00:00`)
  while (cursor <= fim) {
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    out.push(diaDeOperacao(`${y}-${m}-${d}`, cfg, feriados))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** Só as datas abertas — é o que o aviso de "sem registro" deve olhar. */
export function diasAbertos(inicioIso: string, fimIso: string, cfg: ConfigOperacao): string[] {
  return calendarioDoPeriodo(inicioIso, fimIso, cfg).filter((d) => d.aberto).map((d) => d.data)
}
