'use client'

import { useEffect } from 'react'
import { marcarHomeVista } from './actions'

export default function MarcarVisto() {
  useEffect(() => {
    marcarHomeVista()
  }, [])
  return null
}
