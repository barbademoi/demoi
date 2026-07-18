'use client'

import { motion } from 'framer-motion'
import { useTrackingHandlers } from '@/lib/utms'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  id?: string
  gtmClass?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function CTAButton({ size = 'lg', className = '', label, id, gtmClass = '' }: Props) {
  const trackingHandlers = useTrackingHandlers()
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`
  const padding = size === 'lg'
    ? 'px-6 py-4 text-base sm:px-8 sm:py-5 sm:text-lg'
    : size === 'md'
      ? 'px-6 py-4 text-base'
      : 'px-3 py-3 text-xs min-[360px]:px-4 min-[360px]:text-sm'

  return (
    <a
      href="/oferta"
      id={id}
      className={`cta cta-oferta gtm-cta ${gtmClass} inline-block ${className}`}
      {...trackingHandlers}
    >
      <motion.span
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`inline-block min-h-11 rounded-xl bg-[#D4A85A] font-bold text-black shadow-lg shadow-[#D4A85A]/20 transition-colors hover:bg-[#e0b96a] ${padding}`}
      >
        {text}
      </motion.span>
    </a>
  )
}
