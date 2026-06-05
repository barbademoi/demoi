'use client'

import { motion } from 'framer-motion'
import { CtaCompra } from './CtaCompra'

export function Hero() {
  return (
    <section className="relative px-4 pt-12 pb-16 max-w-3xl mx-auto overflow-hidden">
      {/* Bússola decorativa girando muito devagar no fundo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/bussola-decorativa.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] opacity-[0.08] select-none animate-spin"
        style={{ animationDuration: '90s' }}
      />

      <div className="relative text-center space-y-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto mx-auto" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-xs uppercase tracking-wider text-marrom font-semibold"
        >
          IA mentora pra construir cultura
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
          className="text-grafite text-lg leading-relaxed max-w-xl mx-auto"
        >
          A IA da Bússola organiza, sugere e prepara sua reunião semanal. Você
          só anota e fala — ela faz o resto.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-1"
        >
          <CtaCompra />
          <a href="#demo" className="text-sm text-grafite underline hover:text-marrom">
            Ver demonstração
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xs text-chumbo leading-relaxed"
        >
          Em uso real na Demôi Barbearia · <strong className="text-text">11 pessoas</strong> ·
          {' '}<strong className="text-text">1.700+ atendimentos/mês</strong>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-xs text-marrom font-semibold"
        >
          R$ 97 pelo ano · Vagas limitadas aos primeiros 100 clientes
        </motion.p>
      </div>
    </section>
  )
}
