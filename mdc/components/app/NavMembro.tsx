'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/app', rotulo: 'Início', icone: '⌂' },
  { href: '/app/missoes', rotulo: 'Missões', icone: '✓' },
  { href: '/app/biblioteca', rotulo: 'Biblioteca', icone: '▤' },
  { href: '/app/ranking', rotulo: 'Ranking', icone: '★' },
  { href: '/app/plano', rotulo: 'Plano', icone: '◎' },
]

export default function NavMembro({ modo }: { modo: 'topo' | 'base' }) {
  const path = usePathname()
  if (path.startsWith('/app/diagnostico')) return null
  const ativo = (h: string) => (h === '/app' ? path === '/app' : path.startsWith(h))

  if (modo === 'topo') {
    return (
      <nav className="hidden gap-1 sm:flex">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`btn-sm ${ativo(l.href) ? 'bg-latao text-fundo' : 'text-suave hover:text-texto'}`}>
            {l.rotulo}
          </Link>
        ))}
      </nav>
    )
  }
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-fundo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <ul className="grid grid-cols-5">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-semibold ${ativo(l.href) ? 'text-latao' : 'text-suave'}`}>
              <span className="text-xl leading-none" aria-hidden>{l.icone}</span>
              {l.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
