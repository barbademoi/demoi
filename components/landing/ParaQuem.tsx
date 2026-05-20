'use client'

import { motion } from 'framer-motion'

const equipe = [
  'Ranking ao vivo entre os barbeiros',
  'Metas individuais por barbeiro',
  'Meta coletiva com prêmio da equipe',
  'Campanha de pontos por serviço',
]

const sozinho = [
  'Meta pessoal Bronze, Prata e Ouro',
  'Comparativo com o mês anterior',
  'Histórico dos seus últimos meses',
  'Card de resultado pra postar nos stories',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function ParaQuem() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeUp()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-3"
        >
          O sistema <span className="text-[#D4A85A]">se adapta</span> a você.
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mb-12 max-w-2xl mx-auto"
        >
          Marcou &ldquo;equipe&rdquo; ou &ldquo;sozinho&rdquo; na primeira vez que entrou? O BarberMeta muda
          a tela inteira pra fazer sentido pro seu caso.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">

          {/* PARA QUEM TEM EQUIPE */}
          <motion.div
            {...fadeUp(0.15)}
            className="rounded-2xl border border-white/10 bg-[#0F1F2D] p-6 sm:p-7 flex flex-col"
          >
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4A85A]/10 border border-[#D4A85A]/30 mb-5">
              <span className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider">
                👥 Para quem tem equipe
              </span>
            </div>

            <ul className="space-y-3.5">
              {equipe.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#D4A85A] text-base leading-none mt-0.5 shrink-0">→</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* PARA QUEM TRABALHA SOZINHO */}
          <motion.div
            {...fadeUp(0.25)}
            className="rounded-2xl border border-white/10 bg-[#0F1F2D] p-6 sm:p-7 flex flex-col"
          >
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4A85A]/10 border border-[#D4A85A]/30 mb-5">
              <span className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider">
                ✂️ Para quem trabalha sozinho
              </span>
            </div>

            <ul className="space-y-3.5">
              {sozinho.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#D4A85A] text-base leading-none mt-0.5 shrink-0">→</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
