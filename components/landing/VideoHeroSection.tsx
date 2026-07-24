'use client'

import { useState } from 'react'
import CTAButton from './CTAButton'
import WhatsappHeroButton from './WhatsappHeroButton'
import { trackPlayVideoHero } from '@/lib/pixel'

// Seção de VÍDEO logo abaixo do hero: player VERTICAL (9:16) visível na página,
// mas com LAZY-LOAD — mostra a miniatura + play; o iframe do YouTube só carrega
// e toca DEPOIS do clique (não pesa a página). O vídeo toca DENTRO da página.
// Logo abaixo, o CTA de compra principal.
const VIDEO_ID = '7ENkgsYi2-w'
const EMBED_SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1&autoplay=1`
const THUMB = `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`

export default function VideoHeroSection() {
  const [playing, setPlaying] = useState(false)

  function play() {
    setPlaying(true)
    trackPlayVideoHero()
  }

  return (
    <section className="bg-[#0A1929] px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Veja o sistema por dentro</h2>

        {/* Player vertical contido (tipo um celular no meio da seção). max-w
            garante que nunca estoura a largura no mobile. */}
        <div className="mx-auto mt-6 w-full max-w-[300px] sm:max-w-[320px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[28px] border-4 border-[#0F1117] bg-black shadow-2xl shadow-black/50">
            {playing ? (
              <iframe
                src={EMBED_SRC}
                title="BarberMeta por dentro"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={play}
                aria-label="Dar play no vídeo"
                className="group absolute inset-0 h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={THUMB}
                  alt="Prévia do BarberMeta em vídeo"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#D4A85A] text-black shadow-lg transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-7 w-7" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* CTA de compra principal — logo após o vídeo. Mesmo link/tracking do
            botão que ficava no hero. */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
          <WhatsappHeroButton />
          <p className="text-sm text-[#A0AEC0]">Acesso vitalício · Sem mensalidade · 7 dias de garantia</p>
        </div>
      </div>
    </section>
  )
}
