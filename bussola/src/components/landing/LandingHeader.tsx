'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HOTMART_URL } from '@/lib/landingConfig'

// Header fixo da landing. Transparente no topo, com fundo bege + blur +
// shadow ao rolar 80px+. Mobile: só o botão "R$ 97" (oculta "Entrar").
// Z-index 50; o StickyMobileCta usa z-40 — não conflitam.
export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Logo volta pro topo da própria página (não navega).
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isExternoHotmart = HOTMART_URL.startsWith('http')

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-areia/95 backdrop-blur-md shadow-sm border-b border-border/40'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a
            href="#"
            onClick={handleLogoClick}
            aria-label="Voltar ao topo"
            className="flex items-center shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo-completa.svg"
              alt="Bússola"
              className="h-7 md:h-8 w-auto"
            />
          </a>

          {/* Ações */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/entrar"
              className="hidden md:inline-block text-grafite hover:text-marrom font-medium text-sm transition-colors"
            >
              Entrar
            </Link>

            <a
              href={HOTMART_URL}
              target={isExternoHotmart ? '_blank' : undefined}
              rel={isExternoHotmart ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center bg-marrom text-white hover:bg-marrom-escuro transition-colors rounded-md font-semibold shadow-sm hover:shadow-md px-3 py-2 text-sm md:px-4 md:py-2.5"
            >
              <span className="hidden md:inline">Garantir vaga · R$ 97</span>
              <span className="md:hidden">R$ 97</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
