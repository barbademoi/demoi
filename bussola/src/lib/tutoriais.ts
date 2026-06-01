import { Rocket, ClipboardList, MessageCircle, Star, Settings, type LucideIcon } from 'lucide-react'

export type CategoriaTutorial =
  | 'primeiros_passos'
  | 'reuniao'
  | 'feedback'
  | 'cliente'
  | 'configuracoes'

export const CATEGORIAS_TUTORIAL: {
  key: CategoriaTutorial
  nome: string
  icone: LucideIcon
  ordem: number
}[] = [
  { key: 'primeiros_passos', nome: 'Primeiros passos', icone: Rocket, ordem: 1 },
  { key: 'reuniao', nome: 'Sua reunião semanal', icone: ClipboardList, ordem: 2 },
  { key: 'feedback', nome: 'Feedback e comunicação', icone: MessageCircle, ordem: 3 },
  { key: 'cliente', nome: 'Feedback de clientes', icone: Star, ordem: 4 },
  { key: 'configuracoes', nome: 'Configurações', icone: Settings, ordem: 5 },
]

export interface TutorialResumo {
  id: string
  categoria: CategoriaTutorial
  titulo: string
  descricao_curta: string | null
  ordem: number
  num_passos: number
  concluido: boolean
}

export interface PassoTutorial {
  id: string
  numero: number
  titulo: string | null
  conteudo: string
  dica: string | null
}

export function tempoLeituraMin(n: number): number {
  return Math.max(1, n)
}

export function categoriaPorKey(k: string) {
  return CATEGORIAS_TUTORIAL.find((c) => c.key === k)
}
