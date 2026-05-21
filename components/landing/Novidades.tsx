'use client'

import { motion } from 'framer-motion'

const updates = [
  {
    mes: 'Maio 2026',
    destaques: [
      'Lançamento diário com saldo inicial',
      'Ticket médio (faturamento ÷ atendimentos)',
      'Comparativo com o mês anterior',
      'Histórico dos últimos 4 meses',
      'Modo barbeiro sozinho (solo)',
      'Comunidade exclusiva no WhatsApp',
    ],
  },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function Novidades() {
  return (
    <section className="bg-[#0F1F2D] py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <motion.div {...fadeUp()} className="text-center mb-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#D4A85A]/10 border border-[#D4A85A]/30 text-[#D4A85A] text-xs font-bold uppercase tracking-wider">
            🚀 Em constante evolução
          </span>
        </motion.div>

        <motion.h2
          {...fadeUp(0.05)}
          className="text-3xl sm:text-4xl font-bold text-white text-center leading-tight"
        >
          Você compra <span className="text-[#D4A85A]">uma vez</span>.
          <br className="sm:hidden" />
          {' '}Recebe atualizações <span className="text-[#D4A85A]">pra sempre.</span>
        </motion.h2>

        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mt-5 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          O BarberMeta cresce mês a mês com base no que as barbearias pedem na
          comunidade. Olha o que entrou recentemente:
        </motion.p>

        <div className="space-y-5">
          {updates.map((u, i) => (
            <motion.div
              key={u.mes}
              {...fadeUp(0.15 + i * 0.1)}
              className="rounded-2xl border border-white/10 bg-[#0A1929] p-6 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🆕</span>
                <p className="text-[#D4A85A] text-sm font-bold uppercase tracking-wider">{u.mes}</p>
              </div>

              <ul className="space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:space-y-0 sm:gap-y-2.5">
                {u.destaques.map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-[#D4A85A] text-base leading-none mt-1 shrink-0">✓</span>
                    <span className="text-white text-sm sm:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          {...fadeUp(0.35)}
          className="mt-8 text-center text-[#A0AEC0] text-sm sm:text-base"
        >
          Mais vindo aí. <span className="text-white">Sugestões dos clientes viram features</span> — tudo combinado no grupo da comunidade.
        </motion.p>

      </div>
    </section>
  )
}
