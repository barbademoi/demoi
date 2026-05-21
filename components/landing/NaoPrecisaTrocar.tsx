'use client'

import { motion } from 'framer-motion'

const sistemaAtual = [
  'Agendamento',
  'Financeiro',
  'Comissões',
]

const barberMeta = [
  'Metas e motivação',
  'Ranking ao vivo',
  'Bronze/Prata/Ouro',
  'Cards WhatsApp',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function NaoPrecisaTrocar() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeUp()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-5 leading-tight"
        >
          <span className="text-[#D4A85A]">Não precisa</span> trocar de sistema.
        </motion.h2>

        <motion.div
          {...fadeUp(0.1)}
          className="text-[#A0AEC0] text-base sm:text-lg mt-5 mb-12 max-w-2xl mx-auto leading-relaxed space-y-4 text-center"
        >
          <p>
            O BarberMeta <strong className="text-white">não substitui</strong> o seu sistema de agendamento.
          </p>
          <p>
            Você continua usando o <span className="text-white">Agenda Serviço</span>, o <span className="text-white">Trinks</span>, o <span className="text-white">Booksy</span> — ou qualquer outro que já usa hoje.
          </p>
          <p>
            O BarberMeta <strong className="text-white">senta em cima</strong> do que você já tem e faz o que eles não fazem: transforma o faturamento em metas claras, ranking ao vivo e time motivado.
          </p>
          <p className="text-[#D4A85A] font-semibold pt-2">
            São 2 minutos por dia — você consulta a comissão no seu sistema e lança aqui. É tudo.
          </p>
        </motion.div>

        {/* 2 blocos + sinal entre eles */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 sm:gap-7 items-center">

          {/* Bloco 1: Seu sistema atual */}
          <motion.div
            {...fadeUp(0.2)}
            className="rounded-3xl border border-white/12 bg-[#0F1F2D] p-6 sm:p-7"
          >
            <p className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider mb-4">
              Seu sistema atual
            </p>
            <ul className="space-y-3">
              {sistemaAtual.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#A0AEC0] text-base leading-none mt-0.5 shrink-0">✓</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Sinal + */}
          <motion.div
            {...fadeUp(0.25)}
            className="flex items-center justify-center"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D4A85A]/10 border border-[#D4A85A]/40 flex items-center justify-center text-[#D4A85A] text-2xl sm:text-3xl font-light">
              +
            </div>
          </motion.div>

          {/* Bloco 2: BarberMeta */}
          <motion.div
            {...fadeUp(0.3)}
            className="rounded-3xl border border-[#D4A85A]/30 bg-[#0F1F2D] p-6 sm:p-7 shadow-lg shadow-[#D4A85A]/5"
          >
            <p className="text-[#D4A85A] text-xs font-bold uppercase tracking-wider mb-4">
              BarberMeta
            </p>
            <ul className="space-y-3">
              {barberMeta.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#D4A85A] text-base leading-none mt-0.5 shrink-0 font-bold">✓</span>
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
