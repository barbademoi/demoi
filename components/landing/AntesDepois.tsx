'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function AntesDepois() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeUp()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
        >
          Como era na <span className="text-[#D4A85A]">minha</span> barbearia.
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mb-14 max-w-2xl mx-auto"
        >
          Antes do BarberMeta, cada barbeiro mandava o controle diário num
          grupo do WhatsApp. Contas erradas, info perdida, ninguém via o ranking.
        </motion.p>

        {/* Antes vs Depois lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

          {/* ANTES */}
          <motion.div {...fadeUp(0.15)} className="flex flex-col">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-800/40 mb-4">
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
                ✗ Antes
              </span>
            </div>
            <PhoneMockup maxWidth={230}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/img_6056.png"
                alt="Grupo do WhatsApp com mensagens manuais de controle diário dos barbeiros"
                className="block w-full h-auto"
                loading="lazy"
              />
            </PhoneMockup>
            <p className="text-[#A0AEC0] text-sm mt-4 leading-relaxed">
              Cada barbeiro digitava à mão. Demorava 10 min e ninguém
              conseguia ver o próprio progresso de ponto/meta.
            </p>
          </motion.div>

          {/* DEPOIS */}
          <motion.div {...fadeUp(0.25)} className="flex flex-col">
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-green-950/40 border border-green-800/40 mb-4">
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">
                ✓ Depois
              </span>
            </div>
            <PhoneMockup maxWidth={230}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/img_6057.png"
                alt="Tela do BarberMeta pra lançar serviços do dia com botões + e -"
                className="block w-full h-auto"
                loading="lazy"
              />
            </PhoneMockup>
            <p className="text-[#A0AEC0] text-sm mt-4 leading-relaxed">
              Toca +/- nos serviços, o total calcula sozinho. Lançamento
              do dia em 30 segundos, pelo celular.
            </p>
          </motion.div>
        </div>

        {/* Dashboard de Progresso */}
        <motion.div {...fadeUp(0.35)}>
          <PhoneMockup maxWidth={280} className="border-[#D4A85A]/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/prints/img_6058.png"
              alt="Dashboard do barbeiro mostrando ritmo necessário, pontuação do mês e insights"
              className="block w-full h-auto"
              loading="lazy"
            />
          </PhoneMockup>
        </motion.div>
        <motion.p
          {...fadeUp(0.4)}
          className="text-[#A0AEC0] text-base sm:text-lg text-center mt-6 max-w-2xl mx-auto leading-relaxed"
        >
          Cada barbeiro vê o próprio ritmo, o que falta pra bater Bronze/Prata/Ouro,
          e onde está no ranking. Sem cobrança, sem planilha, sem grupo confuso.
        </motion.p>

      </div>
    </section>
  )
}
