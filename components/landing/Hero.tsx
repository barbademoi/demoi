'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import CTAButton from './CTAButton'
import VideoModal from './VideoModal'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.11, ease: 'easeOut' },
  }),
}

const VIDEO_ID = 'DP7mrt90E-A'

export default function Hero() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <section className="relative lg:min-h-screen bg-[#0A1929] flex items-center pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-start lg:items-center">

          {/* ── texto + CTA + credencial Carlos ── */}
          <div className="order-1 lg:order-1 text-center lg:text-left">
            {/* badge cima */}
            <motion.span
              custom={0} variants={fadeUp} initial="hidden" animate="show"
              className="inline-flex items-center gap-2 rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-3 py-1 text-xs font-bold text-[#D4A85A] uppercase tracking-wider mb-5"
            >
              <span>🎯</span>
              Sistema + 6 aulas
            </motion.span>

            <motion.h1
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
            >
              O sistema <span className="text-[#D4A85A]">+ 6 aulas</span> pra você criar, rodar e acompanhar a{' '}
              <span className="text-[#D4A85A]">gincana</span> que aumenta o faturamento da sua barbearia.
            </motion.h1>

            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 text-[#A0AEC0] text-base sm:text-lg leading-relaxed"
            >
              Você não recebe só a ferramenta. Recebe o{' '}
              <span className="text-white font-semibold">passo a passo de quem já faz</span>:
              como montar as metas, engajar o time e transformar disputa em faturamento.
            </motion.p>

            {/* credencial Carlos — avatar pequeno */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] pl-1.5 pr-4 py-1.5"
            >
              <span className="block w-9 h-9 rounded-full overflow-hidden border border-[#D4A85A]/40 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/carlos-hero.jpg"
                  alt=""
                  className="block w-full h-full object-cover"
                />
              </span>
              <span className="text-left">
                <span className="block text-white text-xs sm:text-sm font-semibold leading-tight">
                  Por Carlos Henrique
                </span>
                <span className="block text-[#A0AEC0] text-[11px] sm:text-xs leading-tight">
                  criador do BarberMeta · dono da Demôi
                </span>
              </span>
            </motion.div>

            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
              </div>
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
            </motion.div>

            {/* aviso: nao substitui sistema de gestao */}
            <motion.div
              custom={5} variants={fadeUp} initial="hidden" animate="show"
              className="mt-5 inline-flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-left max-w-md"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">ℹ️</span>
              <span className="text-[#A0AEC0] text-sm leading-relaxed">
                <span className="text-white font-semibold">Não precisa trocar seu sistema de gestão.</span>{' '}
                BarberMeta é um <span className="text-emerald-300 font-semibold">adicional</span> — se integra ao que você já usa (Trinks, Booksy, Agenda Serviço, etc).
              </span>
            </motion.div>
          </div>

          {/* ── miniatura do video vertical (9:16) ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-2 lg:order-2 relative w-full flex justify-center items-center"
          >
            {/* glow dourado por tras */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 bg-[#D4A85A]" />
            </div>

            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label="Assistir vídeo: O sistema rodando — 1 minuto"
              className="group relative z-10 block w-full max-w-[260px] sm:max-w-[300px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl shadow-black/60 cursor-pointer hover:border-[#D4A85A]/60 transition-colors"
            >
              {/* Thumbnail leve do YouTube (sem iframe) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay escuro pra leitura do selo */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80 pointer-events-none" />

              {/* Selo no topo: 2 linhas */}
              <div className="absolute top-4 left-3 right-3 text-center">
                <p className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider leading-tight drop-shadow-lg">
                  Assista: O sistema rodando
                </p>
                <p className="text-[#D4A85A] text-[11px] sm:text-xs font-semibold mt-1 drop-shadow-md">
                  1 min · sem enrolação
                </p>
              </div>

              {/* Botao play centralizado */}
              <span
                aria-hidden
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D4A85A] text-[#0F1117] flex items-center justify-center shadow-2xl shadow-[#D4A85A]/40 group-hover:scale-110 transition-transform"
              >
                {/* triangulo play */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-9 sm:h-9 translate-x-0.5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modal — embed do YouTube so monta quando aberto */}
      <VideoModal videoId={VIDEO_ID} open={videoOpen} onClose={() => setVideoOpen(false)} vertical />
    </section>
  )
}
