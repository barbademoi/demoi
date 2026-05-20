'use client'

import { motion } from 'framer-motion'

const beneficios = [
  'Novidades de cada atualização',
  'Resultados de outras barbearias',
  'Suporte direto pelo grupo',
  'Acesso exclusivo para clientes',
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

export default function Comunidade() {
  return (
    <section className="bg-[#0A1929] py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        <motion.h2
          {...fadeUp()}
          className="text-3xl sm:text-4xl font-bold text-white text-center leading-tight"
        >
          Incluso na compra:{' '}
          <span className="text-[#25D366]">comunidade exclusiva.</span>
        </motion.h2>

        <motion.p
          {...fadeUp(0.1)}
          className="text-center text-[#A0AEC0] text-base sm:text-lg mt-5 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Você não compra só o sistema. Entra numa comunidade de donos de
          barbearia que estão usando o BarberMeta na prática.
          <br />
          <br />
          Novidades de cada atualização, resultados reais de outras barbearias e
          suporte direto — tudo em um grupo exclusivo no WhatsApp.
        </motion.p>

        {/* Card verde-escuro */}
        <motion.div
          {...fadeUp(0.2)}
          className="rounded-3xl border-2 border-[#25D366]/30 bg-gradient-to-br from-[#0E2E1F] to-[#0A1929] p-6 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Glow decorativo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#25D366]/10 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6 justify-center sm:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-2xl shrink-0">
                💬
              </div>
              <div>
                <p className="text-[#25D366] text-xs font-bold uppercase tracking-wider">Grupo no WhatsApp</p>
                <h3 className="text-white font-bold text-lg sm:text-xl leading-tight">
                  Comunidade BarberMeta
                </h3>
              </div>
            </div>

            <ul className="space-y-3.5 mb-7 max-w-md mx-auto sm:mx-0">
              {beneficios.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#25D366] text-lg leading-none mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="text-white text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-center sm:justify-start">
              <a
                href="https://chat.whatsapp.com/JtKyqTixgox7pSAuyNqjxp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1FB855] transition-colors text-white font-bold text-base shadow-lg shadow-[#25D366]/25"
              >
                Entrar na comunidade
                <span className="text-lg leading-none">→</span>
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
