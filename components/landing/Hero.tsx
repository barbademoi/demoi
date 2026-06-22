'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import CTAButton from './CTAButton'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.11, ease: 'easeOut' },
  }),
}

const VIDEO_ID = 'DP7mrt90E-A'

// Vertical video player com "lite-YouTube" pattern:
// - Antes do clique: so a <img> da thumbnail + botao play (pagina leve)
// - Apos clique: swap pra <iframe> que toca dentro da pagina (sem modal)
function HeroVideo() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative w-full max-w-[300px] sm:max-w-[340px] mx-auto">
      {/* glow dourado por tras */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 bg-[#D4A85A]" />
      </div>

      <div className="relative z-10 aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl shadow-black/60">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title="Demonstração do BarberMeta"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Assistir vídeo: O sistema rodando — 1 minuto"
            className="group absolute inset-0 cursor-pointer"
          >
            {/* Thumbnail leve (sem iframe) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay escuro pra leitura do selo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/80 pointer-events-none" />

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
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D4A85A] text-[#0F1117] flex items-center justify-center shadow-2xl shadow-[#D4A85A]/40 group-hover:scale-110 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-9 h-9 sm:w-11 sm:h-11 translate-x-0.5" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            {/* Hint no rodape */}
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <p className="text-white/85 text-[11px] sm:text-xs font-semibold drop-shadow-md">
                ▶ Toque pra assistir aqui mesmo
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export default function Hero() {
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
        {/* Grid: na coluna esquerda do desktop, headline (linha 1) e CTA+resto (linha 2);
            na direita, video ocupa as 2 linhas. Em mobile, fluxo natural: headline -> video -> CTA. */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-start lg:items-center">

          {/* ── BLOCO 1: badge + headline (esquerda topo no desktop) ── */}
          <div className="lg:col-start-1 lg:row-start-1 text-center lg:text-left">
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
          </div>

          {/* ── BLOCO 2: VIDEO (direita no desktop, span 2 rows) ── */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="lg:col-start-2 lg:row-start-1 lg:row-span-2 w-full flex justify-center items-center"
          >
            <HeroVideo />
          </motion.div>

          {/* ── BLOCO 3: subhead + CTA + credencial + aviso (esquerda baixo no desktop) ── */}
          <div className="lg:col-start-1 lg:row-start-2 text-center lg:text-left">
            <motion.p
              custom={2} variants={fadeUp} initial="hidden" animate="show"
              className="text-[#A0AEC0] text-base sm:text-lg leading-relaxed"
            >
              Você não recebe só a ferramenta. Recebe o{' '}
              <span className="text-white font-semibold">passo a passo de quem já faz</span>:
              como montar as metas, engajar o time e transformar disputa em faturamento.
            </motion.p>

            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="mt-7 flex flex-col items-center lg:items-start gap-3"
            >
              <CTAButton id="cta-hero-oferta" gtmClass="gtm-cta-hero" />
              <p className="text-sm text-[#A0AEC0]">
                Acesso vitalício · Sem mensalidade · 7 dias de garantia
              </p>
            </motion.div>

            {/* credencial Carlos — avatar pequeno */}
            <motion.div
              custom={4} variants={fadeUp} initial="hidden" animate="show"
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
        </div>
      </div>
    </section>
  )
}
