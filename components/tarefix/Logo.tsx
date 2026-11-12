/**
 * Logo em texto: "tarefix" minúsculo, Plus Jakarta Sans 800, letter-spacing
 * negativo. O pingo do "i" é um círculo roxo com um check branco.
 * Tamanho controlado por font-size (className="text-3xl" etc.).
 */
export function Logo({ className = 'text-3xl', claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline font-extrabold leading-none tracking-[-0.05em] ${claro ? 'text-white' : 'text-tf-texto'} ${className}`}
      aria-label="tarefix"
      role="img"
    >
      <span aria-hidden>taref</span>
      <span aria-hidden className="relative inline-block">
        {/* "ı" sem pingo + pingo desenhado */}
        ı
        <svg viewBox="0 0 24 24" className="absolute left-1/2 top-[0.05em] h-[0.36em] w-[0.36em] -translate-x-1/2">
          <circle cx="12" cy="12" r="12" fill="#5B3DF5" />
          <path d="M6.8 12.4l3.4 3.3 7-7.2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span aria-hidden>x</span>
    </span>
  )
}
