'use client'

import { motion } from 'framer-motion'
import { useTrackingHandlers } from '@/lib/utms'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  // id e gtmClass servem pra GTM rastrear cada CTA individualmente via
  // gtm.linkClick. <a> nativo + href valido = GTM detecta automaticamente.
  id?: string
  gtmClass?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

// Todo CTA do R$47 vai pra /oferta. UTMs (utm_*, gclid, fbclid, sck) sao
// propagadas da URL atual via handlers em mouseDown/touchStart/focus —
// disparam ANTES da navegacao, sem race condition de hidratacao.
//
// Usa <a> nativo (nao <Link> do next/link) porque <Link> usa props.href pra
// navegar e ignora mutacao do atributo. Tradeoff: perde prefetch automatico
// do Next, mas garante UTM em 100% dos cliques.
export default function CTAButton({
  size = 'lg',
  className = '',
  label,
  id,
  gtmClass = '',
}: Props) {
  const trackingHandlers = useTrackingHandlers()
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`

  const padding = size === 'lg'
    ? 'px-8 py-5 text-lg'
    : size === 'md'
    ? 'px-6 py-4 text-base'
    : 'px-4 py-3 text-sm'

  return (
    <a
      href="/oferta"
      id={id}
      className={`cta cta-oferta gtm-cta ${gtmClass} inline-block`}
      {...trackingHandlers}
    >
      <motion.span
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
      </motion.span>
    </a>
  )
}
