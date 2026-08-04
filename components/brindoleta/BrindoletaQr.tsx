'use client'

import { useMemo } from 'react'
import { createQrMatrix } from '@/lib/brindoleta/qr'

type Props = {
  value: string
  label: string
  className?: string
}

export default function BrindoletaQr({ value, label, className = '' }: Props) {
  const matrix = useMemo(() => createQrMatrix(value), [value])
  const quietZone = 4
  const size = matrix.length + quietZone * 2
  const path = useMemo(() => matrix.flatMap((row, rowIndex) => row.map((dark, columnIndex) => (
    dark ? `M${columnIndex + quietZone} ${rowIndex + quietZone}h1v1h-1z` : ''
  ))).join(''), [matrix])

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#11130f" />
    </svg>
  )
}
