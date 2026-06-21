'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'
import Carousel from './Carousel'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const slides = [
  {
    badge: '✗ Antes',
    badgeClass: 'bg-red-950/40 border border-red-800/40 text-red-400',
    img: '/prints/img_6056.png',
    alt: 'Grupo do WhatsApp com mensagens manuais de controle diário dos barbeiros',
    legenda:
      'Cada barbeiro digitava à mão. Demorava 10 min e ninguém conseguia ver o próprio progresso de ponto/meta.',
  },
  {
    badge: '✓ Depois',
    badgeClass: 'bg-green-950/40 border border-green-800/40 text-green-400',
    img: '/prints/img_6057.png',
    alt: 'Tela do BarberMeta pra lançar serviços do dia com botões + e -',
    legenda:
      'Toca +/− nos serviços, o total calcula sozinho. Lançamento do dia em 30 segundos, pelo celular.',
  },
  {
    badge: '★ Resultado',
    badgeClass: 'bg-[#D4A85A]/15 border border-[#D4A85A]/40 text-[#D4A85A]',
    img: '/prints/img_6058.png',
    alt: 'Dashboard do barbeiro mostrando ritmo necessário, pontuação do mês e insights',
    legenda:
      'Cada barbeiro vê o próprio ritmo, o que falta pra bater Bronze/Prata/Ouro, e onde está no ranking.',
  },
]

export default function AntesDepois() {
  return (
    <section className="bg-[#0A1929] py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        <motion.h2
          {...fadeUp()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
        >
          Como era na <span className="text-[#D4A85A]">minha</span> barbearia.
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mb-10 max-w-2xl mx-auto"
        >
          Antes do BarberMeta, cada barbeiro mandava o controle diário num
          grupo do WhatsApp. Contas erradas, info perdida, ninguém via o ranking.
        </motion.p>

        <motion.div {...fadeUp(0.2)}>
          <Carousel autoRotate={5500} showArrows>
            {slides.map((s) => (
              <div key={s.img} className="flex flex-col items-center px-4 sm:px-8">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${s.badgeClass}`}
                >
                  {s.badge}
                </span>
                <PhoneMockup maxWidth={250}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.img}
                    alt={s.alt}
                    className="block w-full h-auto"
                    loading="lazy"
                  />
                </PhoneMockup>
                <p className="text-[#A0AEC0] text-sm text-center mt-5 max-w-md leading-relaxed">
                  {s.legenda}
                </p>
              </div>
            ))}
          </Carousel>
        </motion.div>

      </div>
    </section>
  )
}
