'use client'

import { useEffect } from 'react'

// Trava o scroll do body enquanto ativo. Usa position:fixed + top:-scrollY
// porque overflow:hidden sozinho não trava no iOS Safari.
export function useBodyScrollLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const scrollY = window.scrollY
    const body = document.body
    const original = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = original.position
      body.style.top = original.top
      body.style.left = original.left
      body.style.right = original.right
      body.style.overflow = original.overflow
      window.scrollTo(0, scrollY)
    }
  }, [ativo])
}
