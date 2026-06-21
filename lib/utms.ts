'use client'

// Propagacao de parametros de tracking (utm_*, sck, xcod, gclid, fbclid, src)
// da URL atual pra qualquer link de saida.
//
// Estrategia: NAO depende de state/render. Em vez disso, mutaciona o atributo
// `href` do <a> no momento que o usuario interage (mouseDown/touchStart/
// pointerDown/focus). Esses eventos disparam ANTES do click/navegacao —
// quando o browser efetua a navegacao, o href ja esta atualizado.
//
// Vantagens:
// - Zero race condition: hidratacao nao precisa ter acontecido
// - Sempre le da URL atual no instante do clique (nao "captura" no mount)
// - Funciona com <a> nativo, preservando gtm.linkClick do GTM
//
// IMPORTANTE: nao funciona com <Link> do next/link, porque ele usa props.href
// pra navegar (ignora o atributo mutado). Use <a> direto, ou um Link sem
// SPA navigation (pouco proposito), pra CTAs que precisam de UTMs.

import { useCallback } from 'react'

const TRACKED = /^(utm_|sck$|xcod$|gclid$|fbclid$|src$)/

function readTrackingFromUrl(): URLSearchParams | null {
  if (typeof window === 'undefined') return null
  const all = new URLSearchParams(window.location.search)
  const out = new URLSearchParams()
  all.forEach((v, k) => {
    if (TRACKED.test(k) && v) out.set(k, v)
  })
  return out.toString() ? out : null
}

// Anexa os parametros de tracking na URL informada. Sobrescreve UTMs velhas
// que ja estejam no href (caso usuario navegue depois com UTMs diferentes).
function mergeTracking(currentHref: string, tracked: URLSearchParams): string {
  if (!currentHref) return currentHref

  // Decompoe: base + query + hash
  const hashIdx = currentHref.indexOf('#')
  const hash = hashIdx >= 0 ? currentHref.slice(hashIdx) : ''
  const noHash = hashIdx >= 0 ? currentHref.slice(0, hashIdx) : currentHref
  const qIdx = noHash.indexOf('?')
  const base = qIdx >= 0 ? noHash.slice(0, qIdx) : noHash
  const existing = qIdx >= 0 ? noHash.slice(qIdx + 1) : ''

  const merged = new URLSearchParams(existing)
  // Remove tracking velho
  Array.from(merged.keys()).forEach(k => {
    if (TRACKED.test(k)) merged.delete(k)
  })
  // Adiciona o novo
  tracked.forEach((v, k) => merged.set(k, v))

  const q = merged.toString()
  return base + (q ? '?' + q : '') + hash
}

// Handler pronto pra anexar em onMouseDown / onTouchStart / onFocus de <a>.
// Pode ser passado direto como prop.
export function applyTrackingToHref(
  e: React.SyntheticEvent<HTMLAnchorElement>,
): void {
  const a = e.currentTarget
  const tracked = readTrackingFromUrl()
  if (!tracked) return
  const current = a.getAttribute('href') || ''
  a.setAttribute('href', mergeTracking(current, tracked))
}

// Hook que devolve um conjunto de handlers prontos pra spread em <a>.
// Uso: <a href="..." {...useTrackingHandlers()}>
export function useTrackingHandlers() {
  const handler = useCallback(applyTrackingToHref, [])
  return {
    onMouseDown: handler,
    onTouchStart: handler,
    onFocus: handler,
  }
}
