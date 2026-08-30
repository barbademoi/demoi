import Link from 'next/link'
import CTAButton from './CTAButton'

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07111F]/90 backdrop-blur-xl">
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
          <span className="text-lg font-bold tracking-tight max-[350px]:hidden">
            <span className="text-white">Barber</span><span className="text-[#F4B942]">Meta</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            id="link-navbar-login-desktop"
            className="gtm-link-anchor hidden text-sm font-medium text-[#B8C3D1] transition-colors hover:text-white sm:inline"
          >
            Já tenho acesso →
          </Link>
          <div className="hidden sm:block">
            <CTAButton size="sm" label="Quero por R$ 97 →" id="cta-navbar-planos-desktop" gtmClass="gtm-cta-navbar" />
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
            <Link
              href="/login"
              id="link-navbar-login-mobile"
              className="gtm-link-anchor hidden min-h-11 shrink-0 items-center px-1.5 py-2 text-xs font-semibold text-[#D6DEE8] transition-colors hover:text-white min-[380px]:inline-flex"
            >
              Entrar
            </Link>
            <CTAButton size="sm" label="1 ano · R$ 97" id="cta-navbar-planos-mobile" gtmClass="gtm-cta-navbar" />
          </div>
        </div>
      </div>
    </header>
  )
}
