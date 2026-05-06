import { formatBRL } from './utils'
import type { MetaIndividual } from '@/types/database'

export interface Insight {
  emoji: string
  texto: string
  destaque?: boolean
}

export function gerarInsightsBarbeiro(params: {
  comissao: number
  metaInd: MetaIndividual | null
  posicaoRanking: number
  totalBarbeiros: number
  totalEquipe: number
  metaColetiva: number
  barberoNome: string
}): Insight[] {
  const { comissao, metaInd, posicaoRanking, totalBarbeiros, totalEquipe, metaColetiva, barberoNome } = params
  const insights: Insight[] = []
  const primeiroNome = barberoNome.split(' ')[0]

  // Progresso individual
  if (metaInd) {
    const { bronze_comm, prata_comm, ouro_comm } = metaInd

    if (ouro_comm > 0 && comissao >= ouro_comm) {
      insights.push({ emoji: '🏆', texto: `${primeiroNome} atingiu o nível Ouro! Performance excepcional este mês.`, destaque: true })
    } else if (prata_comm > 0 && comissao >= prata_comm) {
      const falta = ouro_comm > 0 ? formatBRL(ouro_comm - comissao) : null
      insights.push({ emoji: '⭐', texto: `Prata conquistado!${falta ? ` Faltam só ${falta} para o Ouro.` : ''}`, destaque: true })
    } else if (bronze_comm > 0 && comissao >= bronze_comm) {
      const falta = prata_comm > 0 ? formatBRL(prata_comm - comissao) : null
      insights.push({ emoji: '🥉', texto: `Bronze atingido!${falta ? ` Próxima meta: ${falta} para o Prata.` : ''}`, destaque: true })
    } else if (bronze_comm > 0) {
      const falta = formatBRL(bronze_comm - comissao)
      const pct = Math.round((comissao / bronze_comm) * 100)
      insights.push({ emoji: '💪', texto: `${pct > 0 ? `${pct}% do caminho` : 'Você está'} — faltam ${falta} para o Bronze!` })
    }
  }

  // Posição no ranking
  if (posicaoRanking === 1 && totalBarbeiros > 1) {
    insights.push({ emoji: '🥇', texto: `${primeiroNome} lidera o ranking da equipe este mês!`, destaque: true })
  } else if (posicaoRanking === 2) {
    insights.push({ emoji: '🔥', texto: 'Você está em 2º lugar — só um à frente!' })
  } else if (posicaoRanking === 3 && totalBarbeiros > 3) {
    insights.push({ emoji: '🎯', texto: 'Top 3 da equipe! Continue assim.' })
  }

  // Meta coletiva
  if (metaColetiva > 0) {
    const pctColetivo = Math.round((totalEquipe / metaColetiva) * 100)
    const falta = metaColetiva - totalEquipe
    if (pctColetivo >= 100) {
      insights.push({ emoji: '🎉', texto: 'A equipe bateu a meta coletiva! Parabéns a todos.', destaque: true })
    } else if (pctColetivo >= 80) {
      insights.push({ emoji: '📈', texto: `Equipe a ${pctColetivo}% da meta — faltam ${formatBRL(falta)} para bater!` })
    } else if (pctColetivo >= 50) {
      insights.push({ emoji: '⚡', texto: `Equipe com ${pctColetivo}% da meta coletiva. Bora acelerar!` })
    }
  }

  // Se sem comissão lançada ainda
  if (comissao === 0) {
    insights.length = 0
    insights.push({ emoji: '🚀', texto: `Vamos nessa, ${primeiroNome}! Seu placar ainda está zerado este mês.` })
  }

  return insights.slice(0, 3)
}
