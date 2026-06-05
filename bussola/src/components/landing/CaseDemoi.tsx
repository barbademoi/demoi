'use client'

import { motion } from 'framer-motion'

export function CaseDemoi() {
  return (
    <section className="px-4 py-20 bg-linho/40 border-y border-border">
      <div className="max-w-4xl mx-auto grid lg:grid-cols-[260px_1fr] gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7 }}
          className="text-center lg:text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/carlos.jpg"
            alt="Carlos Henrique"
            className="w-40 h-40 mx-auto lg:mx-0 rounded-full object-cover border-2 border-marrom mb-3 shadow-md"
          />
          <p className="font-semibold text-text">Carlos Henrique</p>
          <p className="text-sm text-chumbo">Fundador da Bússola</p>
          <p className="text-xs text-chumbo">Dono da Demôi Barbearia · Cássia/MG</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="space-y-4 text-grafite leading-relaxed"
        >
          <p>
            Meu negócio cresceu, a equipe foi de 4 pra 11 pessoas, e a reunião
            semanal virou um problema.
          </p>
          <p>
            Comecei a desenhar a Bússola pra mim. Mas o que mudou de verdade não
            foi a reunião — foi a cultura.
          </p>
          <p>
            Hoje a Demôi faz mais de <strong className="text-text">1.700 atendimentos por mês</strong>,
            com média <strong className="text-text">5.0 estrelas</strong>.
            Coletamos mais de uma centena de feedbacks entre internos e Google.
          </p>
          <p>
            Foi a cultura que a Bússola me ajudou a construir, semana após
            semana.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
