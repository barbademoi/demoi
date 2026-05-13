'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import BrandLogo from '@/components/BrandLogo'

interface Props {
  barbeariaNome: string
  showConfig?: boolean
  onConfigClick?: () => void
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/cards',
    label: 'Cards PNG',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
]

export default function Sidebar({ barbeariaNome, showConfig = false, onConfigClick }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const configIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-surface border-b border-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="text-text-muted hover:text-text transition-colors p-1"
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <BrandLogo size="sm" />
        <p className="text-text-muted text-xs font-sans truncate">{barbeariaNome}</p>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-surface border-r border-border
          flex flex-col z-50
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <BrandLogo size="md" />
            <p className="text-text-muted text-xs font-sans mt-1.5 leading-snug">{barbeariaNome}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-text-muted hover:text-text transition-colors"
            aria-label="Fechar menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href && !showConfig
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm
                  transition-colors
                  ${active
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}

          {/* Configurações button */}
          {onConfigClick && (
            <button
              onClick={() => { onConfigClick(); setOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm
                transition-colors text-left
                ${showConfig
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'}
              `}
            >
              {configIcon}
              Configurações
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 text-text-muted hover:text-text hover:bg-surface-2 rounded-xl font-sans text-sm transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
