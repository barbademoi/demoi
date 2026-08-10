'use client'

import { motion } from 'framer-motion'
import { useTrackingHandlers } from '@/lib/utms'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  href?: string
  id?: string
  gtmClass?: string
}

export default function CTAButton({ size = 'lg', className = '', label, href = '#preco', id, gtmClass = '' }: Props) {
  const trackingHandlers = useTrackingHandlers()
  const text = label ?? 'Conhecer os planos'
  const padding = size === 'lg'
    ? 'px-5 py-4 text-base sm:px-8 sm:py-5 sm:text-lg'
    : size === 'md'
      ? 'px-6 py-4 text-base'
      : 'px-3 py-3 text-xs min-[360px]:px-4 min-[360px]:text-sm'

  return (
    <a
      href={href}
      id={id}
      className={`cta cta-oferta gtm-cta ${gtmClass} inline-flex rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4B942] ${className}`}
      {...trackingHandlers}
    >
      <motion.span
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl bg-[#F4B942] font-bold text-[#111827] shadow-lg shadow-[#F4B942]/20 transition-colors hover:bg-[#FFD16A] ${padding}`}
      >
        {text}
      </motion.span>
    </a>
  )
}
