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
// viewport (ou imediatamente se já está visível ao montar). Respeita
// prefers-reduced-motion: vai direto pro valor final.
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
  const startedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setValue(to)
      startedRef.current = true
      return
    }

    function animate() {
      if (startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      function tick(now: number) {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(to * eased)
        if (t < 1) requestAnimationFrame(tick)
        else setValue(to)
      }
      requestAnimationFrame(tick)
    }

    const node = ref.current
    if (!node) return

    // Se o elemento JÁ está visível ao montar (acima do fold no Hero,
    // por exemplo), dispara imediatamente. O IntersectionObserver pode
    // não chamar callback se o elemento já está intersecionado.
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animate()
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate()
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [to, duration])

  const formatted = decimals > 0
    ? value.toFixed(decimals).replace('.', ',')
    : Math.round(value).toLocaleString('pt-BR')

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
