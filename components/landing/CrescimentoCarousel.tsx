'use client'

import Image from 'next/image'
import CarouselNudge from './CarouselNudge'
import { useRolagemContinua } from './useRolagemContinua'

type Resultado = {
  src: string
  nome: string
}

type Props = {
  resultados: Resultado[]
}

const VELOCIDADE_PX_POR_MS = 0.026

export default function CrescimentoCarousel({ resultados }: Props) {
  const { viewportRef, propsDoViewport } = useRolagemContinua(VELOCIDADE_PX_POR_MS)

  return (
    <div className="relative mt-4">
      <div
        ref={viewportRef}
        className="carrossel-continuo"
        aria-label="Resultados de crescimento de nove barbearias que usam o BarberMeta"
        {...propsDoViewport}
      >
        <div className="carrossel-continuo-track">
          {[0, 1].map((grupo) => (
            <ul
              key={grupo}
              className="carrossel-continuo-group"
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
