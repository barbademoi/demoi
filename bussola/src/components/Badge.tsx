import type { LucideIcon } from 'lucide-react'

type Variante = 'positivo' | 'negativo' | 'observacao' | 'critico' | 'neutro'

const VARIANTES: Record<Variante, string> = {
  positivo: 'bg-verde-musgo/10 text-verde-musgo',
  negativo: 'bg-ambar/10 text-ambar',
  observacao: 'bg-azul-noite/10 text-azul-noite',
  critico: 'bg-vinho/10 text-vinho',
  neutro: 'bg-linho text-grafite',
}

export default function Badge({
  variante = 'neutro',
  icon: Icon,
  children,
  className = '',
}: {
  variante?: Variante
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTES[variante]} ${className}`}
    >
      {Icon && <Icon size={14} strokeWidth={1.5} />}
      {children}
    </span>
  )
}
