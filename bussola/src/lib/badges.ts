import { calcularPlacar, type Feedback } from './feedbacks'
import { intervalo } from './periodos'
import type { PontoSemana } from './evolucao'

export interface BadgeMeta {
  chave: string
  emoji: string
  nome: string
  descricao: string
}

export const BADGES: BadgeMeta[] = [
  { chave: 'primeiro_elogio', emoji: '🌟', nome: 'Primeiro elogio', descricao: 'Recebeu seu primeiro feedback positivo.' },
  { chave: 'semana_fogo', emoji: '🔥', nome: 'Semana de fogo', descricao: '5 ou mais elogios em uma única semana.' },
  { chave: 'excelencia', emoji: '💯', nome: 'Excelência', descricao: 'Recebeu um feedback de 5 estrelas.' },
  { chave: 'constancia', emoji: '📅', nome: 'Constância', descricao: '4 semanas seguidas com placar positivo.' },
  { chave: 'mes_perfeito', emoji: '🏆', nome: 'Mês perfeito', descricao: 'Um mês inteiro sem nenhum feedback negativo.' },
  { chave: 'mestre_semana', emoji: '⭐', nome: 'Mestre da semana', descricao: 'O maior placar da semana na equipe.' },
  { chave: 'top3_mes', emoji: '🎯', nome: 'Top 3 do mês', descricao: 'Entre as 3 maiores pontuações do mês.' },
  { chave: 'veterano', emoji: '🌱', nome: 'Veterano', descricao: '6 meses de casa.' },
  { chave: 'imparavel', emoji: '🚀', nome: 'Imparável', descricao: '10 semanas seguidas com placar positivo.' },
]

function maiorSequenciaPositiva(valores: number[]): number {
  let melhor = 0
  let atual = 0
  for (const v of valores) {
    if (v > 0) {
      atual += 1
      melhor = Math.max(melhor, atual)
    } else {
      atual = 0
    }
  }
  return melhor
}

export interface EntradaBadges {
  feedbacks: Feedback[]
  evolucao: PontoSemana[] // recomendado ≥ 12 semanas para os streaks
  dataEntrada: string | null
  mestreSemana: boolean
  top3Mes: boolean
}

// Retorna as chaves das badges conquistadas.
export function calcularBadges(e: EntradaBadges): Set<string> {
  const conquistadas = new Set<string>()
  const { feedbacks, evolucao, dataEntrada } = e

  if (feedbacks.some((f) => f.tipo === 'positivo')) conquistadas.add('primeiro_elogio')
  if (feedbacks.some((f) => f.tipo === 'positivo' && f.estrelas === 5)) conquistadas.add('excelencia')
  if (evolucao.some((p) => p.positivos >= 5)) conquistadas.add('semana_fogo')

  const seq = maiorSequenciaPositiva(evolucao.map((p) => p.valor))
  if (seq >= 4) conquistadas.add('constancia')
  if (seq >= 10) conquistadas.add('imparavel')

  // Mês perfeito: mês corrente com atividade e sem negativos.
  const mes = intervalo('mes')
  const noMes = feedbacks.filter((f) => {
    const t = new Date(f.created_at).getTime()
    return t >= mes.inicio.getTime() && t <= mes.fim.getTime()
  })
  const positivosMes = noMes.filter((f) => f.tipo === 'positivo').length
  const negativosMes = noMes.filter((f) => f.tipo === 'negativo').length
  if (positivosMes > 0 && negativosMes === 0) conquistadas.add('mes_perfeito')

  if (e.mestreSemana) conquistadas.add('mestre_semana')
  if (e.top3Mes) conquistadas.add('top3_mes')

  if (dataEntrada) {
    const entrada = new Date(dataEntrada).getTime()
    const seisMeses = 6 * 30 * 24 * 60 * 60 * 1000
    if (!Number.isNaN(entrada) && Date.now() - entrada >= seisMeses) {
      conquistadas.add('veterano')
    }
  }

  return conquistadas
}

// Usado fora do calcularBadges para evitar import circular em quem só precisa.
export { calcularPlacar }
