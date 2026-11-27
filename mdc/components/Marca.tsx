import Link from 'next/link'

export default function Marca({ href = '/', pequeno = false }: { href?: string; pequeno?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="MDC — Método Demôi de Crescimento">
      <span
        className={`grid place-items-center rounded-xl bg-latao font-black text-fundo ${pequeno ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'}`}
      >
        MDC
      </span>
      <span className="leading-tight">
        <span className={`block font-bold ${pequeno ? 'text-sm' : 'text-base'}`}>Método Demôi</span>
        <span className="block text-xs text-suave">de Crescimento</span>
      </span>
    </Link>
  )
}
