'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAppendTracking } from '@/lib/utms'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  // id e gtmClass servem pra GTM rastrear cada CTA individualmente via
  // gtm.linkClick. O Link do next/link renderiza <a> nativo, entao o
  // gatilho "Click - Just Links" do GTM identifica automaticamente.
  id?: string
  gtmClass?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

// Todo CTA do R$47 vai pra /oferta, uma pagina dedicada que mostra os 2
// planos lado a lado (BarberMeta R$47 e Combo PLUS R$67) com beneficios,
// "por que escolher o combo" e FAQ. O pixel de InitiateCheckout dispara
// quando essa pagina monta (useEffect na /oferta).
//
// UTMs (utm_*, gclid, fbclid, sck) sao propagadas da URL atual pra /oferta —
// la sao novamente repassadas pro checkout Hotmart.
export default function CTAButton({
  size = 'lg',
  className = '',
  label,
  id,
  gtmClass = '',
}: Props) {
  const appendTracking = useAppendTracking()
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`

  const padding = size === 'lg'
    ? 'px-8 py-5 text-lg'
    : size === 'md'
    ? 'px-6 py-4 text-base'
    : 'px-4 py-3 text-sm'

  return (
    <Link
      href={appendTracking('/oferta')}
      id={id}
      className={`cta cta-oferta gtm-cta ${gtmClass} inline-block`}
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
    </Link>
  )
}
