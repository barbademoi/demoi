// Princípios pré-curados de liderança, exibidos nos momentos da reunião.
// O conjunto é rotacionado por estabelecimento + número da semana, então
// o gestor vê princípios diferentes a cada reunião — mas o mesmo princípio
// ao longo da mesma semana.

import type { Momento } from './iaPrompts'

export type MomentoReuniao =
  | 'abertura'
  | 'revisao'
  | 'reconhecimento'
  | 'equipe'
  | 'ajuste'
  | 'encerramento'

interface PrincipioConjunto {
  // Princípio sempre fixo (sai todas as semanas).
  fixo?: string
  // Princípios rotativos. Um por semana, escolhido por hash.
  rotativos: string[]
}

export const PRINCIPIOS: Record<MomentoReuniao, PrincipioConjunto> = {
  abertura: {
    fixo: 'Pressa transmite desinteresse. Calma transmite respeito. Os primeiros 30 segundos de uma reunião valem mais que os próximos 30 minutos.',
    rotativos: [],
  },
  revisao: {
    fixo: 'Equipe sente quando o gestor esquece o que combinou. Quem cobra, gera respeito. Quem esquece, gera descrença.',
    rotativos: [],
  },
  reconhecimento: {
    rotativos: [
      'Elogio precisa ser específico ao comportamento, não genérico à pessoa. "Foi bem" é fraco. "Atendeu a cliente das 14h com paciência" é forte.',
      'Quem se sente notado, escuta melhor o que vem depois. Reconhecimento abre porta pra cobrança.',
      'Reconhecimento em público vale mais que bônus em privado. Equipe lembra do dia que o gestor falou bem dela na frente de todos.',
      'Não dilui o elogio com "mas" logo em seguida. O elogio precisa sustentar sozinho — o ajuste vem depois.',
    ],
  },
  equipe: {
    rotativos: [
      'Equipe que se vê como time entrega mais do que indivíduos somados. Reforce o "nós" sempre que puder.',
      'Quando o coletivo vai bem, fale do coletivo. Quando vai mal, ainda fale do coletivo — não busque culpado.',
      'Cultura não se cria com discurso. Cria-se reforçando comportamentos do dia a dia, semana após semana.',
    ],
  },
  ajuste: {
    rotativos: [
      'Cobrança é cuidado. Quem não cobra, abandona. Mas cobrança no tom errado destrói. O segredo é separar o que a pessoa fez do que a pessoa é.',
      'Descreva a situação, descreva o comportamento, descreva o impacto. Sem adjetivos sobre a pessoa. Só os fatos.',
      'Termine sempre com expectativa clara da próxima semana. Cobrança sem caminho gera frustração.',
    ],
  },
  encerramento: {
    fixo: 'Quem sai de reunião sem saber o que esperar dela mesma na semana seguinte, sai sem direção. Definir 1, 2 ou 3 metas é suficiente — mais que isso vira ruído.',
    rotativos: [],
  },
}

// Hash determinístico simples (fnv1a-ish) — não precisa ser criptográfico.
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h >>> 0
}

// Número da semana ISO (aproximação suficiente).
function semanaDoAno(d: Date): number {
  const inicio = new Date(d.getFullYear(), 0, 1)
  const dias = Math.floor((d.getTime() - inicio.getTime()) / 86400000)
  return Math.floor((dias + inicio.getDay()) / 7)
}

export function principioDaSemana(momento: MomentoReuniao, estabId: string, dataReuniao: Date = new Date()): string {
  const conj = PRINCIPIOS[momento]
  if (conj.fixo) return conj.fixo
  if (conj.rotativos.length === 0) return ''
  const idx = hash(`${estabId}:${semanaDoAno(dataReuniao)}`) % conj.rotativos.length
  return conj.rotativos[idx]
}

// Conversão entre o tipo "Momento" da IA e os 6 momentos visuais da reunião.
export function momentoParaTela(m: Momento): MomentoReuniao {
  if (m === 'reconhecimento') return 'reconhecimento'
  if (m === 'ajuste') return 'ajuste'
  if (m === 'equipe') return 'equipe'
  return 'equipe' // "neutro" não entra como pauta; cai em equipe se forçado
}
