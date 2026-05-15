'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function CTAFinal() {
  return (
    <section className="bg-[#0A1929] py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6"
        >
          Dia 1 do próximo mês: você ainda vai{' '}
          <span className="text-[#D4A85A]">cobrar pelo WhatsApp?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[#A0AEC0] text-lg leading-relaxed mb-10"
        >
          Ou você fecha esse mês igual ao anterior — ou começa o próximo diferente.
          <br />
          Por R$ {PRECO} (uma vez, pra sempre) você muda a relação com a sua equipe
          e para de carregar a motivação deles nas suas costas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <CTAButton label={`Quero o BarberMeta agora — R$ ${PRECO}`} />
          <p className="text-sm text-[#A0AEC0]">
            7 dias de garantia · Reembolso 100% · Sem pegadinha
          </p>
        </motion.div>

      </div>
    </section>
  )
}
