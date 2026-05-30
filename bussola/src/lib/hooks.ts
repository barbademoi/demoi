'use client'

import { useEffect } from 'react'

// Trava o scroll do body enquanto o flag estiver true.
// Use em modais pra evitar que o usuário role a página por trás.
export function useBodyScrollLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [ativo])
}
