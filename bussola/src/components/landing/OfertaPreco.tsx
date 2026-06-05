'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { CtaCompra } from './CtaCompra'

const INCLUSOES = [
  'IA mentora treinada nos fundamentos da gestão',
  'Modo Reunião com 6 momentos guiados',
  'Resumo automático da semana',
  'Equipe sem limite',
  'Feedback de clientes com brindes',
  'Acesso pelo celular (PWA)',
  'Suporte por WhatsApp',
]

export function OfertaPreco() {
  return (
    <section id="oferta" className="px-4 py-20 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15%' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 space-y-2"
      >
        <h2 className="font-serif text-3xl sm:text-4xl text-preto">Acesso completo por 1 ano.</h2>
        <p className="text-grafite">
          Pagamento único. Sem mensalidade. Sem cartão recorrente.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border-2 border-marrom bg-surface shadow-lg p-6 sm:p-8 space-y-5"
      >
        <div className="inline-flex items-center gap-1.5 bg-linho text-marrom text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
          Oferta de lançamento · 100 primeiros clientes
        </div>

        <div className="space-y-1">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-grafite line-through text-base"
          >
            De R$ 197/ano
          </motion.p>
          <motion.p
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="font-serif text-5xl sm:text-6xl text-marrom font-bold leading-none"
          >
            R$ 97
          </motion.p>
          <p className="text-chumbo text-sm">por 12 meses de acesso</p>
        </div>

        <ul className="space-y-2.5 pt-2">
          {INCLUSOES.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="flex items-start gap-2 text-sm text-text"
            >
              <Check size={16} strokeWidth={2.2} className="text-verde-musgo mt-0.5 shrink-0" />
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>

        <CtaCompra variant="large" pulse className="w-full justify-center" />

        <p className="text-xs text-chumbo text-center">
          Pagamento pelo Hotmart · 7 dias de garantia incondicional
        </p>
      </motion.div>

      <p className="text-center text-sm text-chumbo mt-6">
        Após os primeiros 100, o valor passa a ser R$ 197/ano.
      </p>
    </section>
  )
}
