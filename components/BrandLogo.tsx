'use client'

import { useState } from 'react'

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
  const h = heights[size]

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
      src="/logo.png"
      alt="BarberMeta"
      style={{ height: h, width: 'auto' }}
      onError={() => setFailed(true)}
    />
  )
}
