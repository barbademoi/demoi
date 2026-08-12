'use client'

import Image from 'next/image'
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import CarouselNudge from './CarouselNudge'

type Resultado = {
  src: string
  nome: string
}

type Props = {
  resultados: Resultado[]
}

const RETOMAR_APOS_MS = 1800
const VELOCIDADE_PX_POR_MS = 0.026

export default function CrescimentoCarousel({ resultados }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const pausadoRef = useRef(false)
  const retomadaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arrasteRef = useRef({ ativo: false, xInicial: 0, rolagemInicial: 0 })

  const cancelarRetomada = () => {
    if (retomadaRef.current) {
      clearTimeout(retomadaRef.current)
      retomadaRef.current = null
    }
  }

  const pausar = () => {
    cancelarRetomada()
    pausadoRef.current = true
  }

  const retomarDepois = () => {
    cancelarRetomada()
    retomadaRef.current = setTimeout(() => {
      pausadoRef.current = false
      retomadaRef.current = null
    }, RETOMAR_APOS_MS)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const preferenciaDeMovimento = window.matchMedia('(prefers-reduced-motion: reduce)')
    let quadro = 0
    let anterior = performance.now()

    const animar = (agora: number) => {
      const intervalo = Math.min(agora - anterior, 50)
      anterior = agora

      if (!pausadoRef.current && !preferenciaDeMovimento.matches && !document.hidden) {
        const larguraDoCiclo = viewport.scrollWidth / 2

        if (larguraDoCiclo > 0) {
          if (viewport.scrollLeft >= larguraDoCiclo) {
            viewport.scrollLeft -= larguraDoCiclo
          }

          viewport.scrollLeft += intervalo * VELOCIDADE_PX_POR_MS
        }
      }

      quadro = window.requestAnimationFrame(animar)
    }

    quadro = window.requestAnimationFrame(animar)

    return () => {
      window.cancelAnimationFrame(quadro)
      cancelarRetomada()
    }
  }, [])

  const iniciarInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    pausar()

    if (evento.pointerType !== 'mouse') return

    const viewport = viewportRef.current
    if (!viewport) return

    arrasteRef.current = {
      ativo: true,
      xInicial: evento.clientX,
      rolagemInicial: viewport.scrollLeft,
    }
    viewport.setPointerCapture(evento.pointerId)
  }

  const moverInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== 'mouse' || !arrasteRef.current.ativo) return

    const viewport = viewportRef.current
    if (!viewport) return

    evento.preventDefault()
    viewport.scrollLeft = arrasteRef.current.rolagemInicial - (evento.clientX - arrasteRef.current.xInicial)
  }

  const finalizarInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.pointerType === 'mouse' && arrasteRef.current.ativo) {
      arrasteRef.current.ativo = false
      const viewport = viewportRef.current

      if (viewport?.hasPointerCapture(evento.pointerId)) {
        viewport.releasePointerCapture(evento.pointerId)
      }
    }

    retomarDepois()
  }

  return (
    <div className="relative mt-4">
      <div
        ref={viewportRef}
        className="crescimento-carousel"
        aria-label="Resultados de crescimento de nove barbearias que usam o BarberMeta"
        onPointerDown={iniciarInteracao}
        onPointerMove={moverInteracao}
        onPointerUp={finalizarInteracao}
        onPointerCancel={finalizarInteracao}
        onMouseEnter={pausar}
        onMouseLeave={retomarDepois}
      >
        <div className="crescimento-carousel-track">
          {[0, 1].map((grupo) => (
            <ul
              key={grupo}
              className="crescimento-carousel-group"
              aria-hidden={grupo === 1 ? true : undefined}
            >
              {resultados.map((resultado, index) => (
                <li key={`${grupo}-${resultado.nome}`} className="crescimento-carousel-card">
                  <Image
                    src={resultado.src}
                    width={1080}
                    height={1350}
                    alt={grupo === 1 ? '' : `Crescimento real da ${resultado.nome} registrado no BarberMeta`}
                    sizes="(max-width: 640px) 76vw, 320px"
                    className="pointer-events-none block h-auto w-full select-none rounded-[20px]"
                    draggable={false}
                    priority={grupo === 0 && index < 2}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <CarouselNudge className="carousel-nudge-y-center right-3 top-1/2 sm:right-5" />
    </div>
  )
}
