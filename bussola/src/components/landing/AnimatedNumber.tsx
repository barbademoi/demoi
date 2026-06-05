'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface Props {
  to: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

// Count-up animado. Usa useInView do framer-motion (battle-tested) com
// once:true para disparar uma vez quando o elemento entra na viewport
// com margem -100px (precisa estar 100px dentro). Easing easeOutQuart.
// Respeita prefers-reduced-motion: vai direto pro valor final.
export function AnimatedNumber({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1800,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mq.matches) {
        setValue(to)
        return
      }
    }

    let startTime: number | null = null
    let raf = 0

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4) // easeOutQuart
      setValue(to * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setValue(to)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  const formatted =
    decimals > 0
      ? value.toFixed(decimals).replace('.', ',')
      : Math.round(value).toLocaleString('pt-BR')

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
