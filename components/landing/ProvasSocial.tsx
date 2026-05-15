'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const prints = [
  {
    src: '/prints/01-dashboard-ranking.png',
    legenda: 'O ranking que minha equipe vê todo dia',
  },
  {
    src: '/prints/02-card-barbeiro.png',
    legenda: 'Como ficam as metas Bronze, Prata e Ouro',
  },
  {
    src: '/prints/03-mobile-view.png',
    legenda: 'O que cada barbeiro vê no celular',
  },
]

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function ProvasSocial() {
  return (
    <section className="bg-[#0A1929] py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <motion.h2
          {...fadeIn()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
        >
          Funcionou primeiro na{' '}
          <span className="text-[#D4A85A]">minha barbearia.</span>
        </motion.h2>

        {/* depoimento */}
        <motion.div
          {...fadeIn(0.1)}
          className="rounded-2xl border border-white/8 bg-[#0F1F2D] p-8 sm:p-10 mb-16"
        >
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-14 h-14 rounded-full bg-[#D4A85A]/20 border border-[#D4A85A]/40 flex items-center justify-center text-2xl">
              ✂️
            </div>
            <div>
              <p className="text-[#E2E8F0] text-base sm:text-lg leading-relaxed">
                Sou Carlos Henrique, dono da{' '}
                <strong className="text-white">Demôi Barbearia</strong> em Cássia&nbsp;/&nbsp;MG.
                Tenho 7 barbeiros.
              </p>
              <p className="text-[#A0AEC0] text-base sm:text-lg leading-relaxed mt-4">
                Antes, mandava meta no grupo do WhatsApp e ninguém abria. Cobrança no fim do mês
                virou rotina chata. A equipe trabalhava no piloto automático.
              </p>
              <p className="text-[#A0AEC0] text-base sm:text-lg leading-relaxed mt-4">
                Construí o BarberMeta pra resolver isso na minha própria casa. Hoje minha equipe
                se cobra sozinha. Quem tá atrás vê o ranking e corre. Quem é Ouro tem orgulho
                do nível.
              </p>
              <p className="text-[#E2E8F0] text-base sm:text-lg leading-relaxed mt-4 font-medium">
                Tô compartilhando porque funcionou aqui. Vai funcionar aí também.
              </p>
              <p className="mt-6 text-sm text-[#A0AEC0]">
                <span className="font-semibold text-white">Carlos Henrique</span>
                {' '}· Demôi Barbearia · Cássia / MG
              </p>
            </div>
          </div>
        </motion.div>

        {/* prints reais */}
        <motion.p
          {...fadeIn(0.2)}
          className="text-center text-[#A0AEC0] text-base mb-8 uppercase tracking-widest text-xs font-semibold"
        >
          Prints reais do sistema
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {prints.map((p, i) => (
            <motion.div
              key={p.src}
              {...fadeIn(0.2 + i * 0.12)}
              className="flex flex-col gap-3"
            >
              <div className="relative rounded-xl border border-white/10 overflow-hidden shadow-xl bg-black">
                <Image
                  src={p.src}
                  alt={p.legenda}
                  width={360}
                  height={640}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-center text-[#A0AEC0] text-sm leading-snug px-2">
                {p.legenda}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
