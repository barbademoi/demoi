'use client'

import Image from 'next/image'
import CarouselNudge from './CarouselNudge'
import { useRolagemContinua } from './useRolagemContinua'

type Depoimento = {
  src: string
  w: number
  h: number
  alt: string
}

type Props = {
  depoimentos: Depoimento[]
}

// 30px/s: um print de 235px leva ~8s para atravessar. Rápido o bastante para
// não parecer parado, devagar o bastante para dar tempo de ler a conversa e
// decidir segurar o carrossel antes de o print sair de vista.
const VELOCIDADE_PX_POR_MS = 0.03

export default function DepoimentosCarousel({ depoimentos }: Props) {
  const { viewportRef, propsDoViewport } = useRolagemContinua(VELOCIDADE_PX_POR_MS)

  return (
    <div className="relative mx-auto mt-8 max-w-6xl">
      <div
        ref={viewportRef}
        className="carrossel-continuo carrossel-continuo--claro"
        aria-label="Prints de mensagens de donos de barbearia sobre o BarberMeta"
        {...propsDoViewport}
      >
        <div className="carrossel-continuo-track">
          {[0, 1].map((grupo) => (
            <ul
              key={grupo}
              className="carrossel-continuo-group"
              // A segunda cópia existe só para o laço não ter emenda. Para o
              // leitor de tela ela não existe: senão cada depoimento seria
              // anunciado duas vezes.
              aria-hidden={grupo === 1 ? true : undefined}
            >
              {depoimentos.map((depoimento, index) => (
                <li
                  key={`${grupo}-${depoimento.src}`}
                  className="w-[68vw] max-w-[235px] shrink-0 overflow-hidden rounded-2xl border border-[#E2E6EA] bg-[#F7F8FA] shadow-lg shadow-black/10"
                >
                  <Image
                    src={depoimento.src}
                    width={depoimento.w}
                    height={depoimento.h}
                    alt={grupo === 1 ? '' : depoimento.alt}
                    sizes="235px"
                    className="pointer-events-none block h-auto w-full select-none"
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
