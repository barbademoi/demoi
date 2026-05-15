'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import CTAButton from './CTAButton'

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A1929]/80 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <span className="font-bold text-xl tracking-tight shrink-0">
          <span className="text-white">Barber</span>
          <span className="text-[#D4A85A]">Meta</span>
        </span>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#A0AEC0] hover:text-white transition-colors font-medium hidden sm:inline"
          >
            Já tenho acesso →
          </Link>
          <div className="hidden sm:block">
            <CTAButton size="sm" label="Quero o BarberMeta →" />
          </div>
          {/* mobile: só o login */}
          <Link
            href="/login"
            className="text-sm text-[#A0AEC0] hover:text-white transition-colors font-medium sm:hidden"
          >
            Entrar
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
