'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'

const ITENS = [
  { href: '/tarefix/painel', rotulo: 'Hoje', icone: 'M4 12l8-8 8 8M6 10v10h12V10' },
  { href: '/tarefix/painel/colaboradores', rotulo: 'Equipe', icone: 'M16 20v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 11a4 4 0 100-8 4 4 0 000 8zM20 20v-1a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8' },
  { href: '/tarefix/painel/tarefas', rotulo: 'Tarefas', icone: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2' },
  { href: '/tarefix/painel/funcoes', rotulo: 'Funções', icone: 'M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2' },
  { href: '/tarefix/painel/configuracoes', rotulo: 'Ajustes', icone: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z' },
]

function Icone({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

function ativo(pathname: string, href: string) {
  return href === '/tarefix/painel' ? pathname === href : pathname.startsWith(href)
}

/** Barra inferior no celular; coluna lateral no desktop. */
export function Nav({ nomeEmpresa }: { nomeEmpresa: string }) {
  const pathname = usePathname() ?? ''
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-tf-borda bg-tf-card px-4 py-6 lg:flex">
        <Link href="/tarefix/painel" className="px-3">
          <Logo className="text-3xl" />
        </Link>
        <p className="mt-2 truncate px-3 text-sm text-tf-suave">{nomeEmpresa}</p>
        <nav className="mt-8 flex flex-col gap-1">
          {ITENS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 font-bold transition ${
                ativo(pathname, i.href) ? 'bg-tf-marca-clara text-tf-marca-texto' : 'text-tf-suave hover:bg-tf-marca-clara/60'
              }`}
            >
              <Icone d={i.icone} />
              {i.rotulo}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-tf-borda bg-tf-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {ITENS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
              ativo(pathname, i.href) ? 'text-tf-marca-texto' : 'text-tf-suave'
            }`}
          >
            <Icone d={i.icone} />
            {i.rotulo}
          </Link>
        ))}
      </nav>
    </>
  )
}
