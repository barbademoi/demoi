'use client'

import { motion } from 'framer-motion'
import { HOTMART_URL, TEXTO_CTA_COMPRA } from '@/lib/landingConfig'

interface Props {
  variant?: 'primary' | 'dark' | 'large'
  pulse?: boolean
  texto?: string
  className?: string
}

// Botão de compra padronizado. Sempre aponta pra HOTMART_URL e usa o
// texto canônico ("Quero garantir minha vaga por R$ 97").
export function CtaCompra({ variant = 'primary', pulse = false, texto, className = '' }: Props) {
  const label = texto ?? TEXTO_CTA_COMPRA
  const isExterno = HOTMART_URL.startsWith('http')

  const base =
    variant === 'dark'
      ? 'bg-areia text-preto hover:bg-linho'
      : variant === 'large'
        ? 'btn-primary text-base px-6 py-4'
        : 'btn-primary text-base px-6 py-3'

  const cls = `${base} ${variant === 'dark' ? 'inline-flex items-center justify-center font-semibold px-8 py-4 rounded-md transition-colors' : ''} ${className}`

  return (
    <motion.a
      href={HOTMART_URL}
      target={isExterno ? '_blank' : undefined}
      rel={isExterno ? 'noopener noreferrer' : undefined}
      className={cls}
      animate={pulse ? { scale: [1, 1.025, 1] } : undefined}
      transition={pulse ? { duration: 1.6, repeat: Infinity, repeatDelay: 4 } : undefined}
    >
      {label}
    </motion.a>
  )
}
