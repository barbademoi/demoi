'use client'

import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

const comparacao = [
  ['Mensalidade', 'R$ 79 a R$ 199/mês', 'Zero'],
  ['Custo no 1º ano', 'R$ 948+', `R$ ${PRECO}`],
  ['Custo no 5º ano', 'R$ 4.740+', `R$ ${PRECO}`],
  ['Acesso', 'Enquanto pagar', 'Vitalício'],
]

const incluso = [
  'Acesso vitalício',
  'Atualizações grátis',
  'Suporte por email',
  'Acesso pra equipe inteira',
  'Cards prontos pra WhatsApp',
]

export default function Preco() {
  return (
    <section className="bg-[#0F1F2D] py-24 px-4 sm:px-6">
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

        {/* tabela comparação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-white/8 overflow-hidden mb-8"
        >
          <div className="grid grid-cols-3 bg-[#0A1929]">
            <div className="p-4 text-[#A0AEC0] text-sm font-semibold border-b border-white/8" />
            <div className="p-4 text-center text-[#A0AEC0] text-sm font-semibold border-b border-l border-white/8">
              Outros sistemas
            </div>
            <div className="p-4 text-center text-[#D4A85A] text-sm font-semibold border-b border-l border-white/8">
              BarberMeta
            </div>
          </div>
          {comparacao.map(([label, outros, bm], i) => (
            <div key={label} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-[#0A1929]' : 'bg-[#0F1F2D]'}`}>
              <div className="p-4 text-[#A0AEC0] text-sm">{label}</div>
              <div className="p-4 text-center text-[#A0AEC0] text-sm border-l border-white/8">{outros}</div>
              <div className="p-4 text-center text-white font-semibold text-sm border-l border-white/8">{bm}</div>
            </div>
          ))}
        </motion.div>

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
