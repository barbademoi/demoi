'use client'

import { motion } from 'framer-motion'
import { CtaCompra } from './CtaCompra'

export function CtaFinal() {
  return (
    <section className="relative px-4 py-24 bg-preto text-white overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo-simbolo-transparente.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] opacity-[0.08] select-none animate-spin"
        style={{ animationDuration: '30s' }}
      />

      <div className="relative max-w-2xl mx-auto text-center space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7 }}
          className="font-serif text-3xl sm:text-5xl leading-tight"
        >
          Sua próxima reunião pode começar a construir cultura.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/80 text-lg leading-relaxed"
        >
          Junte-se aos primeiros 100 que vão receber acesso completo à Bússola por
          R$ 97 pelo ano todo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="inline-block"
        >
          <CtaCompra variant="dark" pulse />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-xs text-white/60"
        >
          7 dias de garantia · Pagamento pelo Hotmart · Vagas limitadas
        </motion.p>
      </div>
    </section>
  )
}
