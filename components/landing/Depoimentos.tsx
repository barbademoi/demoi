'use client'

import { motion } from 'framer-motion'

// Secao de depoimentos em formato "marquee": rolagem horizontal continua
// que loopa infinitamente. Pausa no hover. Bom pra muitos prints sem
// ocupar muito espaco vertical na pagina.
//
// Como funciona: duplico a lista 2x dentro do container e animo um
// translateX de -50% (so a primeira metade), criando o efeito de loop
// perfeito. Sem JS pra reset — tudo CSS via framer-motion.

const depoimentos = [
  { src: '/prints/feedback-1.png', alt: 'Depoimento Instagram — sucesso com gamificação' },
  { src: '/prints/feedback-2.png', alt: 'Depoimento ducorteflix — Bom dia, estudando' },
  { src: '/prints/feedback-3.png', alt: 'Depoimento Geison Cal — meta ouro atingida' },
  { src: '/prints/feedback-4.png', alt: 'Depoimento henrique.peres_ — os mlk pegaram firme' },
  { src: '/prints/feedback-5.png', alt: 'Depoimento lc_oficial.of — mais intuitivo que cashbarber' },
]

// duplica pra criar loop perfeito
const trilho = [...depoimentos, ...depoimentos]

export default function Depoimentos() {
  return (
    <section className="bg-[#0A1929] border-y border-white/10 py-12 sm:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-7 text-center">
        <span className="inline-block rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/40 px-3 py-1 text-xs font-bold text-[#D4A85A] uppercase tracking-wider mb-3">
          💬 Quem ja usa fala
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          O que estao falando do BarberMeta
        </h2>
        <p className="text-[#A0AEC0] text-sm sm:text-base mt-2">
          Mensagens reais de barbeiros e donos usando o sistema.
        </p>
      </div>

      {/* Trilho do marquee */}
      <div
        className="relative group"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <motion.div
          className="flex gap-5 sm:gap-7 w-max group-hover:[animation-play-state:paused]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 60,
            ease: 'linear',
            repeat: Infinity,
          }}
        >
          {trilho.map((d, i) => (
            <div
              key={`${d.src}-${i}`}
              className="shrink-0 w-[200px] sm:w-[240px] rounded-2xl overflow-hidden border border-white/10 bg-[#0F1117] shadow-2xl shadow-black/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.src}
                alt={d.alt}
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>
      </div>

      <p className="text-center text-[#A0AEC0] text-xs mt-7 px-4">
        Prints publicados com autorização dos clientes.
      </p>
    </section>
  )
}
