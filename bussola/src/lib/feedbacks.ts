export type TipoFeedback = 'positivo' | 'negativo' | 'observacao'
export type EscopoFeedback = 'individual' | 'equipe'

export interface Feedback {
  id: string
  profissional_id: string | null
  estabelecimento_id: string
  escopo: EscopoFeedback
  tipo: TipoFeedback
  categoria: string | null
  texto: string
  audio_url: string | null
  estrelas: number | null
  status: string
  sugestao_ia: string | null
  created_at: string
  deletado_em: string | null
  lido_em: string | null
  resposta_profissional: string | null
  resposta_em: string | null
  visivel_profissional_em: string | null
}

export interface FeedbackComProfissional extends Feedback {
  profissionais: { nome: string; foto_url: string | null } | null
}

interface TipoMeta {
  label: string
  emoji: string
  // classes Tailwind para botão selecionado / badge
  badge: string
  selecionado: string
  estrela: string // cor das estrelas
}

export const TIPOS: Record<TipoFeedback, TipoMeta> = {
  positivo: {
    label: 'Positivo',
    emoji: '👍',
    badge: 'bg-verde-musgo/10 text-verde-musgo',
    selecionado: 'border-verde-musgo bg-verde-musgo text-white',
    estrela: '#8B6F47',
  },
  negativo: {
    label: 'Negativo',
    emoji: '👎',
    badge: 'bg-ambar/10 text-ambar',
    selecionado: 'border-ambar bg-ambar text-white',
    estrela: '#A56336',
  },
  observacao: {
    label: 'Observação',
    emoji: '👁',
    badge: 'bg-azul-noite/10 text-azul-noite',
    selecionado: 'border-azul-noite bg-azul-noite text-white',
    estrela: '#2D3E50',
  },
}

export const CATEGORIAS = [
  'Desempenho técnico',
  'Atendimento',
  'Comportamento',
  'Cultura',
  'Pontualidade',
  'Resultados',
]

export const PLACEHOLDERS: Record<TipoFeedback, string> = {
  positivo: 'O que essa pessoa fez bem? Ex: atendeu o cliente das 14h com paciência…',
  negativo: 'O que precisa melhorar? Ex: chegou 15 min atrasada novamente…',
  observacao: 'Algo a anotar? Ex: comentou que quer fazer um curso…',
}

export const PLACEHOLDERS_EQUIPE: Record<TipoFeedback, string> = {
  positivo: 'O que a equipe fez bem essa semana? Ex: o time tá funcionando muito bem nos finais de semana…',
  negativo: 'O que a equipe precisa melhorar? Ex: ninguém tá pegando as ligações no horário de pico…',
  observacao: 'Algo a anotar sobre o coletivo? Ex: percebi que o clima tá pesado entre o time da tarde…',
}

const LABELS_ESTRELAS: Record<TipoFeedback, string[]> = {
  positivo: [
    '',
    'Legal, vale registrar',
    'Bom desempenho pontual',
    'Acima do esperado',
    'Excelente, exemplo pro time',
    'Excepcional, marco do mês',
  ],
  negativo: [
    '',
    'Erro pequeno',
    'Erro a corrigir, sem urgência',
    'Erro relevante a tratar na reunião',
    'Erro sério, falar individualmente',
    'Erro grave, fere a cultura, ação imediata',
  ],
  observacao: ['', '', '', '', '', ''],
}

export function labelEstrelas(tipo: TipoFeedback, n: number): string {
  return LABELS_ESTRELAS[tipo]?.[n] ?? ''
}

// Placar: positivos somam estrelas, negativos subtraem, observações não entram.
export function calcularPlacar(
  feedbacks: { tipo: TipoFeedback; estrelas: number | null }[]
): number {
  return feedbacks.reduce((acc, f) => {
    const e = f.estrelas ?? 0
    if (f.tipo === 'positivo') return acc + e
    if (f.tipo === 'negativo') return acc - e
    return acc
  }, 0)
}

export type CorPlacar = 'verde' | 'amarelo' | 'vermelho'

export function corPlacar(valor: number): CorPlacar {
  if (valor > 5) return 'verde'
  if (valor < -5) return 'vermelho'
  return 'amarelo'
}

// Texto com sinal: +13 / -3 / 0
export function comSinal(valor: number): string {
  return valor > 0 ? `+${valor}` : `${valor}`
}

// "há 2h", "ontem", "23 de mai"
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function tempoRelativo(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `há ${horas}h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return `${d.getDate()} de ${MESES[d.getMonth()]}`
}

// "23 de maio"
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function dataLonga(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`
}
