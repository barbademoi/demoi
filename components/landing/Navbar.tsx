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
        <Link href="/" id="link-navbar-logo" className="gtm-link-anchor shrink-0 flex items-center gap-2">
          {/* logo icon SVG */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="16" width="5" height="9" rx="1" fill="url(#g1)"/>
            <rect x="11.5" y="10" width="5" height="15" rx="1" fill="url(#g2)"/>
            <rect x="19" y="4" width="5" height="21" rx="1" fill="url(#g3)"/>
            <defs>
              <linearGradient id="g1" x1="6.5" y1="16" x2="6.5" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
              <linearGradient id="g2" x1="14" y1="10" x2="14" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
              <linearGradient id="g3" x1="21.5" y1="4" x2="21.5" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-white">Barber</span>
            <span className="text-[#D4A85A]">Meta</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* desktop */}
          <Link
            href="/login"
            id="link-navbar-login-desktop"
            className="gtm-link-anchor text-sm text-[#A0AEC0] hover:text-white transition-colors font-medium hidden sm:inline"
          >
            Já tenho acesso →
          </Link>
          <div className="hidden sm:block">
            <CTAButton size="sm" label="Quero o BarberMeta →" id="cta-navbar-oferta-desktop" gtmClass="gtm-cta-navbar" />
          </div>

          {/* mobile: botão de compra + botão de acesso */}
          <div className="flex items-center gap-2 sm:hidden">
            <CTAButton size="sm" label={`Garantir — R$ ${PRECO}`} id="cta-navbar-oferta-mobile" gtmClass="gtm-cta-navbar" />
            <Link
              href="/login"
              id="link-navbar-login-mobile"
              className="gtm-link-anchor shrink-0 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Acessar →
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
