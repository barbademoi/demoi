'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

const incluso = [
  'Acesso vitalício',
  'Atualizações grátis',
  'Suporte por email',
  'Acesso pra equipe inteira',
  'Cards prontos pra WhatsApp',
]

export default function Preco() {
  return (
    <section className="bg-[#0F1F2D] py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
        >
          R$ {PRECO} —{' '}
          <span className="text-[#D4A85A]">uma vez. Pra sempre.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-[#A0AEC0] text-lg mb-12"
        >
          Sem mensalidade. Sem cobrança recorrente. Sem surpresa.
        </motion.p>

        {/* caixa de oferta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border-2 border-[#D4A85A]/50 bg-[#0A1929] p-8 sm:p-10 flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <p className="text-[#A0AEC0] text-sm mb-1">pagamento único</p>
            <p className="text-6xl font-bold text-white">R$ {PRECO}</p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
            {incluso.map(item => (
              <li key={item} className="flex items-center gap-2 text-[#E2E8F0] text-sm">
                <span className="text-[#22C55E] font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <CTAButton label={`Quero o BarberMeta agora — R$ ${PRECO}`} />

          <p className="text-sm text-[#A0AEC0]">
            Garantia incondicional de 7 dias
          </p>
        </motion.div>

      </div>
    </section>
  )
}
