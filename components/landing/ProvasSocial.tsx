'use client'

import { motion } from 'framer-motion'

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function ProvasSocial() {
  return (
    <section className="bg-[#0A1929] py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <motion.h2
          {...fadeIn()}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-10"
        >
          Funcionou primeiro na{' '}
          <span className="text-[#D4A85A]">minha barbearia.</span>
        </motion.h2>

        <motion.div
          {...fadeIn(0.1)}
          className="rounded-2xl border border-white/8 bg-[#0F1F2D] p-8 sm:p-10"
        >
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">

            {/* retrato */}
            <div className="shrink-0 w-40 sm:w-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prints/foto-pensativo.jpg"
                alt="Carlos Henrique — Demôi Barbearia"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>

            {/* depoimento */}
            <div className="flex-1">
              <p className="text-[#E2E8F0] text-base sm:text-lg leading-relaxed">
                Sou Carlos Henrique, dono da{' '}
                <strong className="text-white">Demôi Barbearia</strong> em Cássia&nbsp;/&nbsp;MG.
                Tenho 7 barbeiros.
              </p>
              <p className="text-[#A0AEC0] text-base leading-relaxed mt-4">
                Antes, mandava meta no grupo do WhatsApp e ninguém abria. Cobrança no fim do mês
                virou rotina chata. A equipe trabalhava no piloto automático.
              </p>
              <p className="text-[#A0AEC0] text-base leading-relaxed mt-3">
                Construí o BarberMeta pra resolver isso na minha própria casa. Hoje minha equipe
                se cobra sozinha. Quem tá atrás vê o ranking e corre.
              </p>
              <p className="text-[#E2E8F0] text-base leading-relaxed mt-3 font-medium">
                Tô compartilhando porque funcionou aqui. Vai funcionar aí também.
              </p>
              <p className="mt-5 text-sm text-[#A0AEC0]">
                <span className="font-semibold text-white">Carlos Henrique</span>
                {' '}· Demôi Barbearia · Cássia / MG
              </p>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}
