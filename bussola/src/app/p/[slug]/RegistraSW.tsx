'use client'

import { useEffect } from 'react'

export default function RegistraSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // silencioso — PWA é progressivo, falha de SW não quebra a página
      })
    }
  }, [])
  return null
}
