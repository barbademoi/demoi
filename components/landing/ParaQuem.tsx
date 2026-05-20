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
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background:
            'radial-gradient(circle at 20% 50%, #D4A85A 0%, transparent 40%), radial-gradient(circle at 80% 50%, #D4A85A 0%, transparent 40%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative">

        <motion.div {...fadeUp()} className="text-center mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#D4A85A]/10 border border-[#D4A85A]/30 text-[#D4A85A] text-xs font-bold uppercase tracking-wider">
            🎯 Os 2 modos vêm de série
          </span>
        </motion.div>

        <motion.h2
          {...fadeUp(0.05)}
          className="text-3xl sm:text-5xl font-bold text-white text-center leading-tight"
        >
          Equipe <span className="text-[#A0AEC0] font-light">ou</span> sozinho?{' '}
          <span className="text-[#D4A85A]">Escolhe o seu.</span>
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mt-4 mb-14 max-w-2xl mx-auto leading-relaxed"
        >
          O BarberMeta <strong className="text-white">muda a tela inteira</strong> pra fazer sentido pro seu jeito de trabalhar.
          Você ativa o modo na primeira vez que entrar — pode trocar depois nas configurações.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">

          {/* PARA QUEM TEM EQUIPE — visual mais frio/azulado */}
          <motion.div
            {...fadeUp(0.15)}
            className="group relative rounded-3xl border-2 border-[#1E3A5F] bg-gradient-to-br from-[#0F2238] to-[#0A1929] p-6 sm:p-8 flex flex-col shadow-2xl hover:border-[#2A5180] transition-colors"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3A7BC8] to-transparent rounded-t-3xl opacity-60" />

            <div className="flex items-center gap-3 mb-6">
              <div className="text-5xl sm:text-6xl leading-none">👥</div>
              <div>
                <p className="text-[#7FB3F0] text-xs font-bold uppercase tracking-wider">Modo</p>
                <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight">Pra quem tem equipe</h3>
              </div>
            </div>

            <ul className="space-y-3.5 flex-1">
              {equipe.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#3A7BC8] text-lg leading-none mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* PARA QUEM TRABALHA SOZINHO — visual quente/dourado */}
          <motion.div
            {...fadeUp(0.25)}
            className="group relative rounded-3xl border-2 border-[#D4A85A]/30 bg-gradient-to-br from-[#1F1810] to-[#0A1929] p-6 sm:p-8 flex flex-col shadow-2xl hover:border-[#D4A85A]/60 transition-colors"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A85A] to-transparent rounded-t-3xl" />

            <div className="flex items-center gap-3 mb-6">
              <div className="text-5xl sm:text-6xl leading-none">✂️</div>
              <div>
                <p className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider">Modo</p>
                <h3 className="text-white font-bold text-xl sm:text-2xl leading-tight">Pra quem trabalha sozinho</h3>
              </div>
            </div>

            <ul className="space-y-3.5 flex-1">
              {sozinho.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#D4A85A] text-lg leading-none mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>

        {/* Reassurance final */}
        <motion.p
          {...fadeUp(0.35)}
          className="mt-10 text-center text-[#A0AEC0] text-sm sm:text-base"
        >
          Mesmo preço. Mesmo sistema. <span className="text-white font-semibold">Mesmas atualizações pra sempre.</span>
        </motion.p>

      </div>
    </section>
  )
}
