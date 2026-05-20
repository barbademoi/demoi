'use client'

const COMUNIDADE_URL = 'https://chat.whatsapp.com/JtKyqTixgox7pSAuyNqjxp'

export default function ComunidadeCard() {
  return (
    <div className="rounded-3xl border-2 border-[#25D366]/25 bg-gradient-to-br from-[#0E2E1F] to-[#0A1929] p-6 sm:p-7 relative overflow-hidden">
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#25D366]/15 blur-3xl"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-2xl shrink-0">
            💬
          </div>
          <div className="min-w-0">
            <p className="text-[#25D366] text-[10px] sm:text-xs font-bold uppercase tracking-wider font-sans">
              Grupo no WhatsApp · acesso exclusivo
            </p>
            <h3 className="font-serif text-lg sm:text-xl text-white leading-tight">
              Comunidade BarberMeta
            </h3>
            <p className="text-text-muted text-xs sm:text-sm font-sans mt-1.5 leading-relaxed">
              Aqui é onde tudo acontece. Novidades do sistema, resultados de outras
              barbearias, dicas de quem já está usando.
            </p>
          </div>
        </div>

        <a
          href={COMUNIDADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1FB855] transition-colors text-white font-bold text-sm shadow-lg shadow-[#25D366]/20 shrink-0 whitespace-nowrap"
        >
          Entrar na comunidade
          <span className="text-base leading-none">→</span>
        </a>
      </div>
    </div>
  )
}
