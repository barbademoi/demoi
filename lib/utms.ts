'use client'

// Hook que captura parametros de tracking (utm_*, sck, gclid, fbclid, xcod, src)
// da URL atual e devolve uma funcao que os anexa em qualquer URL de destino.
//
// Uso:
//   const appendTracking = useAppendTracking()
//   const href = appendTracking('https://pay.hotmart.com/...')
//
// Le window.location.search direto via useState/useEffect (evita
// useSearchParams do next/navigation, que exige Suspense boundary e
// quebra build estatico de paginas SSG).
//
// Trade-off: na primeira render (SSR), tracked esta vazio — href sai sem
// UTMs. Apos hidratacao, useEffect roda, popula tracked, re-renderiza e
// href ganha UTMs. Cliques durante esse intervalo (~ms) perderiam UTMs,
// mas e' impraticavel na pratica (usuario nao clica antes da hidratacao).

import { useState, useEffect, useCallback } from 'react'

const TRACKED = /^(utm_|sck$|xcod$|gclid$|fbclid$|src$)/

export function useAppendTracking(): (url: string) => string {
  const [tracked, setTracked] = useState<[string, string][]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const t: [string, string][] = []
    params.forEach((v, k) => {
      if (TRACKED.test(k) && v) t.push([k, v])
    })
    if (t.length > 0) setTracked(t)
  }, [])

  return useCallback((baseUrl: string): string => {
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
  }, [tracked])
}
