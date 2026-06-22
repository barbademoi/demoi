'use client'

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

// Vertical video do YouTube embedado direto — usuario clica 1 vez no play
// nativo do YouTube e ja toca. Sem nosso botao intermediario.
// Trade-off: iframe carrega no load da pagina (um pouco mais pesado), mas
// UX e' melhor (um click vs dois).
function HeroVideo() {
  return (
    <div className="relative w-full max-w-[300px] sm:max-w-[340px] mx-auto">
      {/* glow dourado por tras */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-20 bg-[#D4A85A]" />
      </div>

      {/* Selo destacado acima do video */}
      <div className="relative z-10 mb-3 mx-auto inline-flex flex-col items-center justify-center w-full">
        <div className="rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-5 py-2 text-center">
          <p className="text-[#D4A85A] font-bold text-sm sm:text-base uppercase tracking-wider leading-tight">
            Veja o sistema funcionando 👇
          </p>
        </div>
      </div>

      <div className="relative z-10 aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl shadow-black/60">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`}
          title="Demonstração do BarberMeta"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full"
        />
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
