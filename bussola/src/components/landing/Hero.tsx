'use client'

import { motion } from 'framer-motion'
import { PhoneFrame } from './PhoneFrame'
import { PreparaReuniaoMock } from './mocks/PreparaReuniaoMock'
import { CtaCompra } from './CtaCompra'

export function Hero() {
  return (
    <section className="px-4 pt-12 pb-16 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-wider text-marrom font-semibold"
          >
            A ferramenta que constrói cultura na sua empresa
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-serif text-4xl sm:text-5xl text-preto leading-[1.1]"
          >
            Empresa só cresce se a cultura for forte.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-grafite text-lg leading-relaxed"
          >
            A Bússola é o mentor com IA que te ajuda a construir cultura semana após
            semana — usando a conversa com sua equipe como o momento que muda tudo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2"
          >
            <CtaCompra />
            <a href="#solucao" className="text-sm text-grafite underline hover:text-marrom">
              Ver como funciona
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xs text-chumbo leading-relaxed"
          >
            Testada em barbearia real · <strong className="text-text">11 pessoas</strong> ·
            {' '}<strong className="text-text">1.700+ atendimentos/mês</strong> ·
            Mais de uma centena de feedbacks coletados
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="inline-flex items-start gap-2 rounded-md bg-linho border-l-[3px] border-marrom px-3 py-2"
          >
            <p className="text-xs text-marrom font-semibold leading-tight">
              OFERTA DE LANÇAMENTO · Vagas limitadas aos primeiros 100 clientes ·{' '}
              <span className="font-bold">R$ 97 pelo ano todo</span>{' '}
              <span className="font-normal text-chumbo">(depois R$ 197)</span>
            </p>
          </motion.div>
        </div>

        {/* PhoneFrame com float sutil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PhoneFrame size="lg">
              <PreparaReuniaoMock />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
