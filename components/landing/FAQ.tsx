'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const perguntas = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. Funciona no navegador, no celular ou no computador. Você recebe um login por email depois da compra.',
  },
  {
    q: 'Meus barbeiros vão saber mexer?',
    a: 'Sim. Quem usa WhatsApp consegue usar o BarberMeta. Cada barbeiro só precisa abrir um link e ver os próprios números.',
  },
  {
    q: 'Como cada barbeiro acessa o sistema?',
    a: 'Cada barbeiro recebe um link único. Abre no celular, sem criar conta ou lembrar senha. É só abrir e ver.',
  },
  {
    q: 'Posso adicionar barbeiro depois?',
    a: 'Sim, quantos quiser, quando quiser. Sem custo extra.',
  },
  {
    q: 'A Hotmart cobra algum imposto extra?',
    a: 'Não. O preço de R$ 47 é o valor final. Sem taxa, sem cobrança recorrente, sem surpresa.',
  },
]

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-white font-medium text-base group-hover:text-[#D4A85A] transition-colors">
          {q}
        </span>
        <span className={`text-[#D4A85A] text-xl shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[#A0AEC0] text-base leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  return (
    <section className="bg-[#0F1F2D] py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-white text-center mb-10"
        >
          Dúvidas frequentes
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/8 bg-[#0A1929] px-6"
        >
          {perguntas.map(({ q, a }) => (
            <Item key={q} q={q} a={a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
