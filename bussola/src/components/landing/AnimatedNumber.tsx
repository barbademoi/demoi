'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  to: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

// Count-up reutilizável. Anima 0 → `to` quando o elemento entra na
// viewport. Respeita prefers-reduced-motion: já mostra o valor final.
export function AnimatedNumber({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1500,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setReduced(true)
      setValue(to)
      return
    }

    const node = ref.current
    if (!node) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        const start = performance.now()
        function tick(now: number) {
          const elapsed = now - start
          const t = Math.min(1, elapsed / duration)
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(to * eased)
          if (t < 1) requestAnimationFrame(tick)
          else setValue(to)
        }
        requestAnimationFrame(tick)
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [to, duration])

  const display = reduced ? to : value
  const formatted = decimals > 0
    ? display.toFixed(decimals).replace('.', ',')
    : Math.round(display).toLocaleString('pt-BR')

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
