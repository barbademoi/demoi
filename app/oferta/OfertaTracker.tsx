'use client'

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/pixel'

export default function OfertaTracker() {
  useEffect(() => {
    trackViewContent('Assinatura BarberMeta')
  }, [])

  return null
}
