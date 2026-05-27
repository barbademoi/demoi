'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
}

const heights = { sm: 26, md: 34, lg: 46 }

export default function BrandLogo({ size = 'md' }: Props) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const h = heights[size]

  // Cobre o caso em que a imagem já falhou antes da hidratação: o onError
  // dispara no HTML inicial, antes do React anexar o handler, e não dispara
  // de novo. Sem isto, ficava o ícone de imagem quebrada na tela.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) {
    return (
      <span className={`font-serif ${sizes[size]} text-text`}>
        Barber<span className="metal-text-gold">Meta</span>
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src="/logo-barbermeta.png"
      alt="BarberMeta"
      style={{ height: h, width: 'auto' }}
      onError={() => setFailed(true)}
    />
  )
}
