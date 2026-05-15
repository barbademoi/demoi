'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A1929]/80 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-barbermeta.jpg"
            alt="BarberMeta"
            className="h-10 w-auto rounded-sm"
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* desktop */}
          <Link
            href="/login"
            className="text-sm text-[#A0AEC0] hover:text-white transition-colors font-medium hidden sm:inline"
          >
            Já tenho acesso →
          </Link>
          <div className="hidden sm:block">
            <CTAButton size="sm" label="Quero o BarberMeta →" />
          </div>

          {/* mobile: botão de compra + botão de acesso */}
          <div className="flex items-center gap-2 sm:hidden">
            <CTAButton size="sm" label={`Garantir — R$ ${PRECO}`} />
            <Link
              href="/login"
              className="shrink-0 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Acessar →
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
