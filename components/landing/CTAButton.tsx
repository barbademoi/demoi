'use client'

import { motion } from 'framer-motion'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'
const CHECKOUT_URL = 'https://pay.hotmart.com/D105833676F?sck=HOTMART_PRODUCT_PAGE&off=9rjhgvlk&hotfeature=32'

export default function CTAButton({ size = 'lg', className = '', label }: Props) {
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`

  const padding = size === 'lg'
    ? 'px-8 py-5 text-lg'
    : size === 'md'
    ? 'px-6 py-4 text-base'
    : 'px-4 py-3 text-sm'

  return (
    <motion.a
      href={CHECKOUT_URL}
      target={CHECKOUT_URL.startsWith('http') ? '_blank' : undefined}
      rel={CHECKOUT_URL.startsWith('http') ? 'noopener noreferrer' : undefined}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`
        inline-block rounded-xl font-bold text-black text-center
        bg-[#D4A85A] hover:bg-[#e0b96a] transition-colors
        shadow-lg shadow-[#D4A85A]/20
        ${padding} ${className}
      `}
    >
      {text}
    </motion.a>
  )
}
