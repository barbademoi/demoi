import Link from 'next/link'
import CTAButton from './CTAButton'

const PRECO = process.env.NEXT_PUBLIC_PRECO ?? '47'

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0A1929]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          href="/"
          id="link-navbar-logo"
          aria-label="BarberMeta — início"
          className="gtm-link-anchor flex shrink-0 items-center gap-2"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="4" y="16" width="5" height="9" rx="1" fill="url(#g1)" />
            <rect x="11.5" y="10" width="5" height="15" rx="1" fill="url(#g2)" />
            <rect x="19" y="4" width="5" height="21" rx="1" fill="url(#g3)" />
            <defs>
              <linearGradient id="g1" x1="6.5" y1="16" x2="6.5" y2="25"><stop stopColor="#C8973A" /><stop offset="1" stopColor="#F0C060" /></linearGradient>
              <linearGradient id="g2" x1="14" y1="10" x2="14" y2="25"><stop stopColor="#C8973A" /><stop offset="1" stopColor="#F0C060" /></linearGradient>
              <linearGradient id="g3" x1="21.5" y1="4" x2="21.5" y2="25"><stop stopColor="#C8973A" /><stop offset="1" stopColor="#F0C060" /></linearGradient>
            </defs>
          </svg>
          <span className="text-lg font-bold tracking-tight max-[360px]:hidden">
            <span className="text-white">Barber</span><span className="text-[#D4A85A]">Meta</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/login"
            id="link-navbar-login-desktop"
            className="gtm-link-anchor hidden text-sm font-medium text-[#A0AEC0] transition-colors hover:text-white sm:inline"
          >
            Já tenho acesso →
          </Link>
          <div className="hidden sm:block">
            <CTAButton size="sm" label="Quero o BarberMeta →" id="cta-navbar-oferta-desktop" gtmClass="gtm-cta-navbar" />
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
            <CTAButton size="sm" label={`Garantir — R$ ${PRECO}`} id="cta-navbar-oferta-mobile" gtmClass="gtm-cta-navbar" />
            <Link
              href="/login"
              id="link-navbar-login-mobile"
              className="gtm-link-anchor inline-flex min-h-11 shrink-0 items-center rounded-lg border border-white/20 bg-white/5 px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <span className="max-[340px]:hidden">Acessar&nbsp;</span>→
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
