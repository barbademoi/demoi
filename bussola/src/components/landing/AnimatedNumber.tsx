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

// Count-up defensivo. 3 caminhos independentes de disparo pra garantir
// que SEMPRE anima até o valor final, mesmo se IntersectionObserver
// falhar ou o elemento estiver borderline na viewport:
//
//   1) Verifica getBoundingClientRect no mount — se já visível, dispara.
//   2) IntersectionObserver com rootMargin generoso (50px) pra antecipar.
//   3) Fallback setTimeout 2s — se nada disparou, força animação.
//
// Respeita prefers-reduced-motion (vai direto pro valor final).
export function AnimatedNumber({
  to,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1800,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setValue(to)
      startedRef.current = true
      return
    }

    const animate = () => {
      if (startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const eased = 1 - Math.pow(1 - t, 4) // easeOutQuart
        setValue(to * eased)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setValue(to)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const node = ref.current
    if (!node) return

    // (1) Já visível ao montar?
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animate()
      return
    }

    // (2) IntersectionObserver com antecipação de 50px
    let obs: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animate()
            obs?.disconnect()
          }
        },
        { threshold: 0, rootMargin: '50px 0px' },
      )
      obs.observe(node)
    }

    // (3) Fallback de segurança: se 2s passaram sem disparar, força.
    const fallback = window.setTimeout(() => {
      if (!startedRef.current) animate()
    }, 2000)

    return () => {
      obs?.disconnect()
      window.clearTimeout(fallback)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [to, duration])

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
