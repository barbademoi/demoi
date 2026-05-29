// Antes a Bússola tinha tipos (positivo/negativo/observação) e estrelas.
// Hoje tudo é "observação". Os tipos foram aposentados pela Parte 2 do AJUSTE F.
// Esses tipos seguem exportados pra back-compat com componentes ainda em
// transição (FeedbackItem, AtividadeItem, Timeline), até serem reescritos
// nas próximas fases.
export type TipoFeedback = 'positivo' | 'negativo' | 'observacao'
export type EscopoFeedback = 'individual' | 'equipe'
export type MomentoReuniao = 'reconhecimento' | 'ajuste' | 'equipe' | 'neutro' | null

export interface Feedback {
  id: string
  profissional_id: string | null
  estabelecimento_id: string
  escopo: EscopoFeedback
  // tipo e estrelas só sobrevivem aqui porque alguns componentes ainda os
  // exibem em registros antigos. Não são mais escritos no banco.
  tipo: TipoFeedback | null
  categoria: string | null
  texto: string
  audio_url: string | null
  estrelas: number | null
  status: string
  sugestao_ia: string | null
  momento_reuniao: MomentoReuniao
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
  badge: string
  selecionado: string
  estrela: string
}

// Mantido pra back-compat (cards antigos). Novos registros não têm tipo.
export const TIPOS: Record<'positivo' | 'negativo' | 'observacao', TipoMeta> = {
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

// Placeholders únicos (sem variação por tipo, que não existe mais).
export const PLACEHOLDER_INDIVIDUAL = (nome: string) =>
  `Anote o que você observou sobre ${nome}. Pode ser algo bom, algo a melhorar, ou qualquer comentário.`

export const PLACEHOLDER_EQUIPE =
  'Anote o que você observou sobre a equipe. Pode ser algo positivo, algo a melhorar, ou qualquer comentário.'

export function labelEstrelas(_tipo: TipoFeedback, _n: number): string {
  return ''
}

// Placar: aposentado, retorna 0 pra qualquer entrada (mantido como noop
// até as telas serem migradas).
export function calcularPlacar(
  _feedbacks: { tipo: TipoFeedback | null; estrelas: number | null }[]
): number {
  return 0
}

export type CorPlacar = 'verde' | 'amarelo' | 'vermelho'

export function corPlacar(_valor: number): CorPlacar {
  return 'amarelo'
}

export function comSinal(valor: number): string {
  return valor > 0 ? `+${valor}` : `${valor}`
}

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

const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

export function dataLonga(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}`
}
