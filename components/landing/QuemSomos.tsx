'use client'

import { motion } from 'framer-motion'

export default function QuemSomos() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-8"
        >
          Feito por dono.{' '}
          <span className="text-[#D4A85A]">Pra dono.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/8 bg-[#0F1F2D] p-8 text-left space-y-4"
        >
          <p className="text-[#E2E8F0] text-lg leading-relaxed">
            Não somos uma agência. Não somos um curso.
          </p>
          <p className="text-[#A0AEC0] text-base leading-relaxed">
            Somos uma barbearia que construiu uma ferramenta pra si mesma e decidiu
            compartilhar com outros donos.
          </p>
          <p className="text-[#A0AEC0] text-base leading-relaxed">
            Você não tá pagando pra ver vídeo. Tá pagando por um sistema que roda,
            funciona, e foi testado em barbearia de verdade antes de chegar até você.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4A85A]/15 border border-[#D4A85A]/30 flex items-center justify-center text-lg">
              ✂️
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Carlos Henrique</p>
              <p className="text-[#A0AEC0] text-xs">Demôi Barbearia · Cássia / MG</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
