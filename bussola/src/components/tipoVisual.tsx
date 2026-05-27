import { Sparkles, Sprout, Eye, type LucideIcon } from 'lucide-react'
import type { TipoFeedback } from '@/lib/feedbacks'

interface TipoVisual {
  label: string
  Icon: LucideIcon
  cor: string // hex pra style inline (ícones)
  // classes Tailwind: texto, borda esquerda do card e fundo leve do badge
  texto: string
  bordaEsq: string
  badge: string
}

export const TIPO_VISUAL: Record<TipoFeedback, TipoVisual> = {
  positivo: {
    label: 'Elogio',
    Icon: Sparkles,
    cor: '#5C7148',
    texto: 'text-verde-musgo',
    bordaEsq: 'border-l-verde-musgo',
    badge: 'bg-verde-musgo/10 text-verde-musgo',
  },
  negativo: {
    label: 'Ponto a desenvolver',
    Icon: Sprout,
    cor: '#A56336',
    texto: 'text-ambar',
    bordaEsq: 'border-l-ambar',
    badge: 'bg-ambar/10 text-ambar',
  },
  observacao: {
    label: 'Observação',
    Icon: Eye,
    cor: '#2D3E50',
    texto: 'text-azul-noite',
    bordaEsq: 'border-l-azul-noite',
    badge: 'bg-azul-noite/10 text-azul-noite',
  },
}
