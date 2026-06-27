'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import CTAButton from './CTAButton'
import VideoModal from './VideoModal'

const VIDEO_ID = 'mNh_84Wi-0U'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.11, ease: 'easeOut' },
  }),
}

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
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-16 items-start lg:items-center">

          {/* ── texto + CTA + autoridade do Carlos ── */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
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

            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-stretch">
                <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />

                {/* Botao secundario — abre modal com video de demonstracao */}
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  aria-label="Ver o sistema por dentro — vídeo de demonstração"
                  className="gtm-btn-video inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 px-6 py-4 text-base font-semibold text-white transition-colors"
                  id="btn-hero-video"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#D4A85A] shrink-0" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Ver o sistema por dentro
                </button>
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

          {/* ── mockup celular do dashboard + foto Carlos sobreposta ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="order-1 lg:order-2 relative w-full flex justify-center items-center pb-36 sm:pb-44 lg:pb-48"
          >
            {/* glow dourado por tras */}
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-25 bg-[#D4A85A]" />
            </div>

            {/* Phone mockup — dashboard mobile */}
            <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px]">
              <div className="relative rounded-[40px] border-[8px] border-[#0F1117] bg-[#0F1117] shadow-2xl shadow-black/60 overflow-hidden">
                {/* notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#0F1117] rounded-b-2xl z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prints/mobile-dashboard-hero.jpg"
                  alt="Dashboard do BarberMeta no celular — Meta Coletiva com 70%"
                  className="block w-full h-auto"
                />
              </div>

              {/* Foto Carlos sobreposta — redonda, centralizada na borda inferior do mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.45, ease: 'easeOut' }}
                className="absolute z-20 left-1/2 -translate-x-1/2 -bottom-20 sm:-bottom-24 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="rounded-full overflow-hidden border-[5px] border-emerald-400 shadow-2xl shadow-emerald-500/30 bg-[#0F1F2D] w-[140px] h-[140px] sm:w-[170px] sm:h-[170px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/prints/carlos-hero.jpg"
                      alt=""
                      className="block w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-white font-bold text-sm sm:text-base leading-tight">Carlos Henrique</p>
                  <p className="text-[#D4A85A] text-[11px] sm:text-xs font-semibold leading-tight">criador do BarberMeta</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal — embed do YouTube so monta quando aberto */}
      <VideoModal videoId={VIDEO_ID} open={videoOpen} onClose={() => setVideoOpen(false)} aspect="horizontal" />
    </section>
  )
}
