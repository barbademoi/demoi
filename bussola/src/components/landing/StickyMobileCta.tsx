'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HOTMART_URL } from '@/lib/landingConfig'

// CTA fixo no rodapé do mobile. Aparece quando o usuário rolou ≥30% da
// página. Pulse sutil a cada 6s. Respeita prefers-reduced-motion.
export function StickyMobileCta() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = window.scrollY / max
      setVisivel(pct >= 0.3)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visivel && (
        <motion.a
          href={HOTMART_URL}
          target={HOTMART_URL.startsWith('http') ? '_blank' : undefined}
          rel={HOTMART_URL.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-marrom text-white text-center font-semibold py-3.5 px-4 shadow-[0_-6px_18px_rgba(0,0,0,0.18)]"
          initial={{ y: 80, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { type: 'spring', damping: 18, stiffness: 220 },
          }}
          exit={{ y: 80, opacity: 0 }}
        >
          <motion.span
            className="inline-block"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 4.6 }}
          >
            Garantir vaga · R$ 97
          </motion.span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
