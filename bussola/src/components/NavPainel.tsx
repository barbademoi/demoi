'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITENS = [
  { href: '/painel', label: 'Home', icon: '🏠', exato: true },
  { href: '/painel/profissionais', label: 'Profissionais', icon: '👥' },
  { href: '/painel/feedback/novo', label: 'Registrar', icon: '🎯' },
  { href: '/painel/reuniao', label: 'Reunião', icon: '📋' },
  { href: '/painel/historico-reunioes', label: 'Histórico', icon: '📚' },
  { href: '/painel/configuracoes', label: 'Configurações', icon: '⚙️' },
]

const MOBILE = ITENS.filter((i) => i.href !== '/painel/configuracoes')

export default function NavPainel() {
  const pathname = usePathname()
  const ativo = (item: (typeof ITENS)[number]) =>
    item.exato ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden sm:block w-52 shrink-0 border-r border-border min-h-[calc(100vh-57px)] p-3">
        <nav className="space-y-1 sticky top-[73px]">
          {ITENS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                ativo(i) ? 'bg-primary-soft text-primary font-medium' : 'text-text-muted hover:bg-background',
              ].join(' ')}
            >
              <span>{i.icon}</span>
              {i.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex">
        {MOBILE.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={[
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              ativo(i) ? 'text-primary font-medium' : 'text-text-muted',
            ].join(' ')}
          >
            <span className="text-lg leading-none">{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
