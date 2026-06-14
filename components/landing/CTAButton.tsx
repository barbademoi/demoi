'use client'

import { motion } from 'framer-motion'
import { trackInitiateCheckout } from '@/lib/pixel'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

// Rola suave pra secao #preco — onde os 2 cards (R$47 e R$67) ficam lado
// a lado. Em vez de abrir modal, leva o lead pra escolher a oferta na
// propria pagina, sem fricao. trackInitiateCheckout serve so de sinal
// pro pixel ("intencao de compra").
function scrollToPreco() {
  trackInitiateCheckout(Number(PRECO) || 47)
  const el = document.getElementById('preco')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    // Fallback: hash navegacao caso a secao ainda nao tenha montado.
    window.location.hash = 'preco'
  }
}

export default function CTAButton({ size = 'lg', className = '', label }: Props) {
  const text = label ?? `Quero o BarberMeta — R$ ${PRECO}`

  const padding = size === 'lg'
    ? 'px-8 py-5 text-lg'
    : size === 'md'
    ? 'px-6 py-4 text-base'
    : 'px-4 py-3 text-sm'

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    scrollToPreco()
  }

  return (
    <motion.a
      href="#preco"
      onClick={handleClick}
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
