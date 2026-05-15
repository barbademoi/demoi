'use client'

import { motion } from 'framer-motion'

export default function Garantia() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-6xl mb-6"
        >
          🛡️
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-6"
        >
          Garantia incondicional de{' '}
          <span className="text-[#D4A85A]">7 dias.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-4 text-[#A0AEC0] text-lg leading-relaxed mb-8"
        >
          <p>
            Compra hoje. Usa 7 dias. Se não achar que vale cada centavo,
            pede reembolso por dentro da Hotmart e te devolvemos 100% do valor.
          </p>
          <p>
            Sem pergunta, sem ligação de retenção, sem desculpa pra segurar.
          </p>
          <p className="text-[#E2E8F0]">
            A gente confia no produto. Se você não confiar, o dinheiro é seu de volta.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 px-6 py-3"
        >
          <span className="text-[#22C55E]">✓</span>
          <span className="text-[#22C55E] font-semibold text-sm">
            100% seguro · 7 dias · Reembolso garantido
          </span>
        </motion.div>
      </div>
    </section>
  )
}
