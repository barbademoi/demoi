import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  size?: number
  className?: string
  color?: string
  strokeWidth?: number
  'aria-hidden'?: boolean
}

// Wrapper padrão pra ícones Lucide: stroke 1.5 e tamanho 20px por padrão.
export default function IconBox({ icon: Icon, size = 20, className, color, strokeWidth = 1.5 }: Props) {
  return <Icon size={size} strokeWidth={strokeWidth} color={color} className={className} aria-hidden />
}
