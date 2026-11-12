'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { META_PIXEL_ID, trackPageView } from '@/lib/pixel'

// Dispara PageView em cada mudanca de rota client-side.
function RouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Tarefix é outro produto (uso interno da equipe): não entra no Pixel.
    if (pathname === '/tarefix' || pathname?.startsWith('/tarefix/')) return
    trackPageView()
  }, [pathname, searchParams])

  return null
}

export default function MetaPixel() {
  const pathname = usePathname()
  if (!META_PIXEL_ID) return null
  // Tarefix é outro produto (uso interno da equipe): nada de Pixel lá,
  // nem a imagem de fallback do <noscript>.
  if (pathname === '/tarefix' || pathname?.startsWith('/tarefix/')) return null

  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
    </>
  )
}
