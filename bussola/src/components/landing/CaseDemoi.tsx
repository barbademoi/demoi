'use client'

import { motion } from 'framer-motion'

const PARAGRAFOS = [
  'Há alguns anos, eu era o problema da minha empresa. Meu negócio crescia, a equipe foi de 4 pra 11 pessoas, e eu sentia que estava perdendo o controle da cultura. A reunião semanal era improvisada, cada um saía com uma sensação diferente do que tinha sido falado.',
  'Tentei livros de gestão. Tentei cursos. Tentei imitar outros donos. Nada encaixava na realidade da barbearia. E entre atender cliente e pagar conta, eu nunca tinha tempo de estudar.',
  'Comecei a desenhar a Bússola pra mim. Anotava observações no celular durante a semana, e a IA me montava a pauta pronta. Mas o que mudou de verdade não foi a reunião — foi a cultura.',
  'Hoje a Demôi faz mais de 1.700 atendimentos por mês, com média 5.0 estrelas. Coletamos mais de uma centena de feedbacks entre internos e Google. A equipe trabalha bem mesmo quando eu não estou olhando. E isso é cultura.',
]

export function CaseDemoi() {
  return (
    <section className="px-4 py-20 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6 }}
          className="font-serif text-3xl sm:text-4xl text-preto text-center mb-12 leading-tight"
        >
          Como tudo começou: a Demôi Barbearia.
        </motion.h2>

        <div className="grid lg:grid-cols-[260px_1fr] gap-10 items-start">
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

          <div className="space-y-4 text-grafite leading-relaxed">
            {PARAGRAFOS.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                {p}
              </motion.p>
            ))}

            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="font-serif text-xl sm:text-2xl text-marrom leading-snug pt-3"
            >
              Agora a Bússola sai da minha barbearia pra ajudar outras empresas
              a construir a mesma cultura.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
