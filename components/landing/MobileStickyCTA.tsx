sed: --: No such file or directory
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
        bg-[#0A1929]/95 backdrop-blur border-t border-white/8
        px-4 py-3 transition-transform duration-300
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <CTAButton className="block w-full [&>span]:block [&>span]:w-full [&>span]:text-center" size="md" id="cta-sticky-mobile-oferta" gtmClass="gtm-cta-sticky" />
    </div>
  )
}
