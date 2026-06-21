'use client'

// Hook que captura parametros de tracking (utm_*, sck, gclid, fbclid, xcod, src)
// da URL atual e devolve uma funcao que os anexa em qualquer URL de destino.
//
// Uso:
//   const appendTracking = useAppendTracking()
//   const href = appendTracking('https://pay.hotmart.com/...')
//
// Funciona pra URLs absolutas (Hotmart, Stripe) e relativas (/oferta).

import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

// Quais parametros propagar pro checkout.
// utm_* = padrao Google Analytics
// sck, xcod = parametros nativos da Hotmart pra tracking
// gclid, fbclid = identificadores de campanha Google Ads / Meta Ads
// src = generico
const TRACKED = /^(utm_|sck$|xcod$|gclid$|fbclid$|src$)/

export function useAppendTracking(): (url: string) => string {
  const params = useSearchParams()

  return useCallback((baseUrl: string): string => {
    if (!params) return baseUrl

    const tracked: [string, string][] = []
    params.forEach((v, k) => {
      if (TRACKED.test(k) && v) tracked.push([k, v])
    })
    if (tracked.length === 0) return baseUrl

    // URL absoluta (https://...) → usa o construtor URL
    if (/^https?:\/\//.test(baseUrl)) {
      try {
        const u = new URL(baseUrl)
        tracked.forEach(([k, v]) => u.searchParams.set(k, v))
        return u.toString()
      } catch {
        // fallback se URL invalida
      }
    }

    // URL relativa (/oferta) → concatena manualmente preservando hash
    const [pathQuery, hash] = baseUrl.split('#')
    const sep = pathQuery.includes('?') ? '&' : '?'
    const tail = tracked.map(([k, v]) =>
      `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    ).join('&')
    return pathQuery + sep + tail + (hash ? '#' + hash : '')
  }, [params])
}
