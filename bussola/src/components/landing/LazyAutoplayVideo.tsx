'use client'

import { useEffect, useRef, useState } from 'react'
import { AutoplayVideo } from './AutoplayVideo'

interface LazyAutoplayVideoProps {
  src: string
  className?: string
  poster?: string
}

// Mesma API do AutoplayVideo, mas só monta o <video> quando entra
// (ou está perto de entrar) na viewport. Enquanto isso mostra o
// poster como placeholder. Reduz custo de download e bateria no
// mobile pra vídeos que ficam fora da tela inicial.
export function LazyAutoplayVideo({ src, className = '', poster }: LazyAutoplayVideoProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full h-full">
      {visible ? (
        <AutoplayVideo src={src} className={className} poster={poster} />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className={`w-full h-full object-cover ${className}`} />
      ) : (
        <div className="w-full h-full bg-areia" aria-hidden />
      )}
    </div>
  )
}
