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

  // Sem comissão ainda
  if (comissao === 0) {
    insights.push({ emoji: '🚀', texto: `Seu placar ainda está zerado, ${primeiroNome}. Cada atendimento conta — bora começar!` })
    if (metaInd?.bronze_comm && metaInd.bronze_comm > 0) {
      insights.push({ emoji: '🎯', texto: `Sua primeira meta é ${formatBRL(metaInd.bronze_comm)} para o Bronze. Você consegue!` })
    }
    return insights
  }

  // Progresso por tier
  if (metaInd) {
    const { bronze_comm, prata_comm, ouro_comm } = metaInd

    if (ouro_comm > 0 && comissao >= ouro_comm) {
      insights.push({ emoji: '🏆', texto: `${primeiroNome} atingiu o Ouro! Performance excepcional — você está no topo!`, destaque: true })
    } else if (ouro_comm > 0 && comissao >= ouro_comm * 0.8) {
      const falta = formatBRL(ouro_comm - comissao)
      const pct = Math.round((comissao / ouro_comm) * 100)
      insights.push({ emoji: '🔥', texto: `${pct}% do Ouro — faltam só ${falta}! Você está muito perto!`, destaque: true })
    } else if (prata_comm > 0 && comissao >= prata_comm) {
      if (ouro_comm > 0) {
        const falta = formatBRL(ouro_comm - comissao)
        insights.push({ emoji: '⭐', texto: `Prata conquistado! Faltam ${falta} para o Ouro — não para agora!`, destaque: true })
      } else {
        insights.push({ emoji: '⭐', texto: `Prata atingido, ${primeiroNome}! Ótima performance no mês!`, destaque: true })
      }
    } else if (bronze_comm > 0 && comissao >= bronze_comm) {
      if (prata_comm > 0) {
        const falta = formatBRL(prata_comm - comissao)
        const pct = Math.round((comissao / prata_comm) * 100)
        insights.push({ emoji: '🥉', texto: `Bronze garantido! ${pct}% do Prata — faltam ${falta} para subir de nível!`, destaque: true })
      } else {
        insights.push({ emoji: '🥉', texto: `Bronze atingido, ${primeiroNome}! Objetivo cumprido!`, destaque: true })
      }
    } else if (bronze_comm > 0) {
      const falta = formatBRL(bronze_comm - comissao)
      const pct = Math.round((comissao / bronze_comm) * 100)
      if (pct >= 70) {
        insights.push({ emoji: '💪', texto: `${pct}% do Bronze — faltam apenas ${falta}! Sprint final!` })
      } else if (pct >= 40) {
        insights.push({ emoji: '📈', texto: `Você está a ${pct}% do Bronze. Faltam ${falta} — continue assim!` })
      } else {
        insights.push({ emoji: '🎯', texto: `Meta Bronze: ${formatBRL(bronze_comm)}. Você já fez ${formatBRL(comissao)} — siga em frente!` })
      }
    }
  }

  // Posição no ranking
  if (totalBarbeiros > 1) {
    if (posicaoRanking === 1) {
      insights.push({ emoji: '🥇', texto: `${primeiroNome} lidera o ranking da equipe! Mantenha o ritmo e inspire os colegas.`, destaque: true })
    } else if (posicaoRanking === 2) {
      insights.push({ emoji: '🔥', texto: `Você está em 2º no ranking — só um colega à frente. Vai que você alcança!` })
    } else if (posicaoRanking === 3 && totalBarbeiros > 3) {
      insights.push({ emoji: '🎯', texto: `Top 3 da equipe! Você está se destacando este mês.` })
    }
  }

  // Meta coletiva
  if (metaColetiva > 0 && totalEquipe > 0) {
    const pctColetivo = Math.round((totalEquipe / metaColetiva) * 100)
    const faltaCol = formatBRL(Math.max(0, metaColetiva - totalEquipe))
    if (pctColetivo >= 100) {
      insights.push({ emoji: '🎉', texto: `A equipe bateu a meta coletiva! Todos merecem comemorar.`, destaque: true })
    } else if (pctColetivo >= 85) {
      insights.push({ emoji: '⚡', texto: `Equipe a ${pctColetivo}% da meta! Faltam ${faltaCol} juntos — o prêmio coletivo está perto!` })
    } else if (pctColetivo >= 60) {
      insights.push({ emoji: '📊', texto: `Equipe com ${pctColetivo}% da meta coletiva. Cada comissão sua ajuda a equipe a ganhar o prêmio!` })
    }
  }

  return insights.slice(0, 3)
}
