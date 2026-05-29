export type StatusProfissional = 'ativo' | 'afastado' | 'desligado'

export interface Profissional {
  id: string
  estabelecimento_id: string
  slug: string
  nome: string
  telefone: string | null
  foto_url: string | null
  funcao: string | null
  data_entrada: string | null
  status: StatusProfissional
  motivadores: string[] | null
  estilo_comunicacao: string | null
  pontos_fortes: string | null
  pontos_desenvolvimento: string | null
  notas_livres: string | null
  competencias: Record<string, number> | null
  created_at: string
}

export const FUNCOES_SUGERIDAS = ['Atendente', 'Recepcionista', 'Gerente', 'Auxiliar', 'Vendedor', 'Operador']

export const MOTIVADORES = [
  'Dinheiro / comissão',
  'Reconhecimento público',
  'Folga / tempo livre',
  'Aprendizado e treinamento',
  'Crescimento na carreira',
]

export const MAX_MOTIVADORES = 3

export const ESTILOS_COMUNICACAO = [
  'Direto, sem rodeios',
  'Com cuidado, abordagem suave',
  'Sempre em particular',
]

export const COMPETENCIAS: { chave: string; label: string }[] = [
  { chave: 'tecnica', label: 'Conhecimento técnico' },
  { chave: 'atendimento', label: 'Atendimento ao cliente' },
  { chave: 'pontualidade', label: 'Pontualidade e presença' },
  { chave: 'equipe', label: 'Trabalho em equipe' },
  { chave: 'organizacao', label: 'Organização' },
  { chave: 'resultados', label: 'Resultados' },
]
