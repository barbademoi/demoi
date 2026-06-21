import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#060F18] border-t border-white/5 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="16" width="5" height="9" rx="1" fill="url(#fg1)"/>
            <rect x="11.5" y="10" width="5" height="15" rx="1" fill="url(#fg2)"/>
            <rect x="19" y="4" width="5" height="21" rx="1" fill="url(#fg3)"/>
            <defs>
              <linearGradient id="fg1" x1="6.5" y1="16" x2="6.5" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
              <linearGradient id="fg2" x1="14" y1="10" x2="14" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
              <linearGradient id="fg3" x1="21.5" y1="4" x2="21.5" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#C8973A"/><stop offset="1" stopColor="#F0C060"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-bold text-xl">
            <span className="text-white">Barber</span>
            <span className="text-[#D4A85A]">Meta</span>
          </span>
        </div>
        <p className="text-[#A0AEC0] text-sm">
          © 2026 BarberMeta · Cássia / MG
        </p>
        <p className="text-[#A0AEC0] text-sm">
          suporte@barbermeta.com.br
        </p>
        <Link
          href="/login"
          id="link-footer-login"
          className="gtm-link-anchor text-sm text-[#D4A85A] hover:text-white transition-colors"
        >
          Já é cliente? Acessar minha conta →
        </Link>
        <div className="flex gap-4 text-xs text-[#A0AEC0]">
          <a href="/privacidade" id="link-footer-privacidade" className="gtm-link-anchor hover:text-white transition-colors">Política de privacidade</a>
          <span>·</span>
          <a href="/termos" id="link-footer-termos" className="gtm-link-anchor hover:text-white transition-colors">Termos de uso</a>
        </div>
      </div>
    </footer>
  )
}
