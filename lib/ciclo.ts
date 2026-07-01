/**
 * Ciclo de fechamento personalizado.
 *
 * Hoje o sistema usa "mês calendário" (1 ao 30/31). Algumas barbearias
 * fecham em datas diferentes (ex: dia 5 ao 4 do mês seguinte).
 *
 * Este módulo centraliza o cálculo do ciclo atual e helpers relacionados.
 * Quem usa dia_fechamento=1 (default) tem comportamento idêntico ao antigo.
 *
 * Convenção de identificação nas tabelas (mes, ano):
 *   - mes/ano = mês/ano do INÍCIO do ciclo
 *   - Ex: dia_fechamento=5, ciclo 05/mai → 04/jun → (mes=5, ano=2026)
 */

import { nomeMes } from './utils'

export interface Ciclo {
  // Mês/ano do início do ciclo — usado como chave em (lancamentos.mes/ano, metas.mes/ano)
  mesRef: number
  anoRef: number
  // Datas reais do intervalo
  inicio: Date
  fim: Date
  // 'YYYY-MM-DD' (útil pra queries de lancamentos_diarios)
  inicioIso: string
  fimIso: string
  // Quantos dias o ciclo tem (28 a 31)
  totalDias: number
  // Label pra exibir na UI
  label: string
  labelCurto: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1 // inclusive
}

/**
 * Retorna um Date cujo valor local (getDate/getMonth/getFullYear/getHours)
 * representa a data/hora ATUAL no fuso America/Sao_Paulo — INDEPENDENTE
 * do fuso do servidor.
 *
 * Motivo: na Vercel, o servidor roda em UTC. `new Date()` la retorna hora
 * UTC. Como o Brasil e' UTC-3, as 21h de Sao Paulo o servidor ja marca 00h
 * do dia SEGUINTE. Se calcularmos o ciclo com essa data errada, a virada
 * de mes/ciclo acontece 3h ANTES do que deveria.
 *
 * Aqui usamos toLocaleString com timeZone=America/Sao_Paulo pra pegar a
 * data no fuso Brasil, e reparse pra Date. Assim getDate/getMonth/etc.
 * retornam valores do calendario brasileiro.
 */
export function hojeBrasil(): Date {
  const now = new Date()
  const brStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  return new Date(brStr)
}

function buildLabel(inicio: Date, fim: Date, diaFechamento: number): { label: string; labelCurto: string } {
  if (diaFechamento === 1) {
    // Mês calendário: usa o formato antigo "Maio 2026"
    return {
      label: `${nomeMes(inicio.getMonth() + 1)} ${inicio.getFullYear()}`,
      labelCurto: `${nomeMes(inicio.getMonth() + 1)} ${inicio.getFullYear()}`,
    }
  }
  // Ciclo personalizado: "05 mai — 04 jun"
  const ini = `${pad2(inicio.getDate())} ${nomeMes(inicio.getMonth() + 1).slice(0, 3).toLowerCase()}`
  const fimStr = `${pad2(fim.getDate())} ${nomeMes(fim.getMonth() + 1).slice(0, 3).toLowerCase()}`
  return {
    label: `${ini} — ${fimStr}`,
    labelCurto: `${ini} — ${fimStr}`,
  }
}

/**
 * Calcula o ciclo que CONTÉM uma data dada.
 */
export function cicloDeData(data: Date, diaFechamento: number): Ciclo {
  const dia = data.getDate()
  const mes = data.getMonth() + 1
  const ano = data.getFullYear()

  // Se a data é >= dia_fechamento, o ciclo começa no mes atual.
  // Senão, começa no mês anterior.
  let mesInicio: number
  let anoInicio: number
  if (dia >= diaFechamento) {
    mesInicio = mes
    anoInicio = ano
  } else {
    if (mes === 1) {
      mesInicio = 12
      anoInicio = ano - 1
    } else {
      mesInicio = mes - 1
      anoInicio = ano
    }
  }

  const inicio = new Date(anoInicio, mesInicio - 1, diaFechamento)

  // Fim: dia anterior ao dia_fechamento do próximo mês
  let mesFim: number
  let anoFim: number
  if (mesInicio === 12) {
    mesFim = 1
    anoFim = anoInicio + 1
  } else {
    mesFim = mesInicio + 1
    anoFim = anoInicio
  }
  const fim = new Date(anoFim, mesFim - 1, diaFechamento - 1)
  // Caso especial: dia_fechamento=1 → fim = último dia do mes_inicio
  if (diaFechamento === 1) {
    const ultimoDia = new Date(anoInicio, mesInicio, 0).getDate()
    fim.setFullYear(anoInicio, mesInicio - 1, ultimoDia)
  }

  const labels = buildLabel(inicio, fim, diaFechamento)

  return {
    mesRef: mesInicio,
    anoRef: anoInicio,
    inicio,
    fim,
    inicioIso: toIso(inicio),
    fimIso: toIso(fim),
    totalDias: daysBetween(inicio, fim),
    label: labels.label,
    labelCurto: labels.labelCurto,
  }
}

/**
 * Ciclo que contém hoje.
 */
export function cicloAtual(diaFechamento: number, hoje = hojeBrasil()): Ciclo {
  return cicloDeData(hoje, diaFechamento)
}

/**
 * N ciclos anteriores ao ciclo atual (do mais antigo pro mais recente),
 * NÃO inclui o ciclo atual. Use cicloAtual + cicloNDiasAtras pra ter o conjunto completo.
 */
export function cicloNDiasAtras(diaFechamento: number, n: number, hoje = hojeBrasil()): Ciclo[] {
  const out: Ciclo[] = []
  // Pega o ciclo de uma data que está dentro do ciclo desejado (ex: meio do mês anterior)
  for (let i = n; i >= 1; i--) {
    const atual = cicloAtual(diaFechamento, hoje)
    // Vai pro mês anterior, mantendo o mesmo dia
    const dataReferencia = new Date(atual.inicio)
    dataReferencia.setMonth(dataReferencia.getMonth() - i)
    out.push(cicloDeData(dataReferencia, diaFechamento))
  }
  return out
}

/**
 * Calcula dias úteis (Seg–Sáb) corridos e restantes dentro de um intervalo.
 * Não considera feriados.
 */
export function calcDiasUteisCiclo(
  inicio: Date,
  fim: Date,
  hoje = new Date(),
): { diasUteisCorridos: number; diasUteisRestantes: number; diasTotaisCiclo: number; diasRestantesCiclo: number } {
  let corridos = 0
  let totaisCiclo = 0
  const cursor = new Date(inicio)
  cursor.setHours(0, 0, 0, 0)
  const fimNorm = new Date(fim)
  fimNorm.setHours(23, 59, 59, 999)
  const hojeNorm = new Date(hoje)
  hojeNorm.setHours(0, 0, 0, 0)

  while (cursor <= fimNorm) {
    const dow = cursor.getDay() // 0 = dom, 1-6 = seg-sab
    const isUtil = dow !== 0 // Segunda a sábado
    if (isUtil) totaisCiclo += 1
    if (cursor <= hojeNorm && isUtil) corridos += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  const diasUteisRestantes = Math.max(0, totaisCiclo - corridos)

  // Dias corridos restantes (não úteis) — útil pra countdowns
  const msDiff = fimNorm.getTime() - hojeNorm.getTime()
  const diasRestantesCiclo = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)))

  // Total de dias do ciclo
  const diasTotaisCiclo = Math.round((fimNorm.getTime() - new Date(inicio).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) + 1

  return {
    diasUteisCorridos: corridos,
    diasUteisRestantes,
    diasTotaisCiclo,
    diasRestantesCiclo,
  }
}
