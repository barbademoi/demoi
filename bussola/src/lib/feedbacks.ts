// A tabela ainda se chama "feedbacks" no banco (não renomeada), mas o produto
// só fala em "observações". Tipo e estrelas foram aposentados na Parte 2 do
// AJUSTE F — sobreviveram aqui apenas como campos opcionais pra leitura
// de registros antigos.

export type EscopoFeedback = 'individual' | 'equipe'
export type MomentoReuniao = 'reconhecimento' | 'ajuste' | 'equipe' | 'neutro' | null

// Mantido como tipo opcional só por causa de registros antigos selecionados
// em /api/ia/sugerir-fala (que ainda referencia fb.tipo defensivamente).
export type TipoFeedback = 'positivo' | 'negativo' | 'observacao'

export interface Feedback {
  id: string
  profissional_id: string | null
  estabelecimento_id: string
  escopo: EscopoFeedback
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

export const CATEGORIAS = [
  'Desempenho técnico',
  'Atendimento',
  'Comportamento',
  'Cultura',
  'Pontualidade',
  'Resultados',
]

export const PLACEHOLDER_INDIVIDUAL = (nome: string) =>
  `Anote o que você observou sobre ${nome}. Pode ser algo bom, algo a melhorar, ou qualquer comentário.`

export const PLACEHOLDER_EQUIPE =
  'Anote o que você observou sobre a equipe. Pode ser algo positivo, algo a melhorar, ou qualquer comentário.'

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
