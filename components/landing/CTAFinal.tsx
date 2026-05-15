'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function CTAFinal() {
  return (
    <section className="bg-[#0A1929] py-16 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* texto + botão */}
          <div className="flex-1 text-center lg:text-left">
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
              className="text-[#A0AEC0] text-lg leading-relaxed mb-8"
            >
              Ou você fecha esse mês igual ao anterior — ou começa o próximo diferente.
              Por R$ {PRECO} (uma vez, pra sempre) você muda a relação com a sua equipe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center lg:items-start gap-4"
            >
              <CTAButton label={`Quero o BarberMeta agora — R$ ${PRECO}`} />
              <p className="text-sm text-[#A0AEC0]">
                7 dias de garantia · Reembolso 100% · Sem pegadinha
              </p>
            </motion.div>
          </div>

          {/* foto apontando */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="shrink-0 w-56 sm:w-64 lg:w-72"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/prints/foto-apontando.png"
              alt="Carlos Henrique recomenda o BarberMeta"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </motion.div>

        </div>
      </div>
    </section>
  )
}
