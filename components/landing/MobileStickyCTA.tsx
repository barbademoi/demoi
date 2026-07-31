'use client'

import { useEffect, useState } from 'react'
import CTAButton from './CTAButton'

export default function MobileStickyCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`
        sm:hidden fixed bottom-0 left-0 right-0 z-50
        bg-[#07111F]/95 backdrop-blur border-t border-white/10
        px-3 py-2.5 transition-transform duration-300
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <CTAButton label="Quero o BarberMeta · R$ 47" className="flex w-full [&>span]:flex [&>span]:w-full [&>span]:text-center" size="md" id="cta-sticky-mobile-oferta" gtmClass="gtm-cta-sticky" />
    </div>
  )
}
