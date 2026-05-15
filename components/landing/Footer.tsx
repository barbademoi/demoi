import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#060F18] border-t border-white/5 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
        <span className="font-bold text-xl">
          <span className="text-white">Barber</span>
          <span className="text-[#D4A85A]">Meta</span>
        </span>
        <p className="text-[#A0AEC0] text-sm">
          © 2026 BarberMeta · Cássia / MG
        </p>
        <p className="text-[#A0AEC0] text-sm">
          suporte@barbermeta.com.br
        </p>
        <Link
          href="/login"
          className="text-sm text-[#D4A85A] hover:text-white transition-colors"
        >
          Já é cliente? Acessar minha conta →
        </Link>
        <div className="flex gap-4 text-xs text-[#A0AEC0]">
          <a href="/privacidade" className="hover:text-white transition-colors">Política de privacidade</a>
          <span>·</span>
          <a href="/termos" className="hover:text-white transition-colors">Termos de uso</a>
        </div>
      </div>
    </footer>
  )
}
