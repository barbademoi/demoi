import Link from 'next/link'

export const metadata = {
  title: 'Página não encontrada — BarberMeta',
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md text-center animate-fade-in">

        {/* Marca */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl text-text">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
        </div>

        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-primary"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="font-serif text-3xl text-text mb-3">
          Página não encontrada
        </h2>
        <p className="text-text-muted text-sm font-sans leading-relaxed mb-8 max-w-sm mx-auto">
          O link que você abriu não existe, foi removido ou tem alguma letra
          errada. Confere o endereço ou volta pro começo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-ghost text-sm py-2.5 px-5">
            ← Voltar pra home
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm py-2.5 px-5">
            Ir pro dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}
