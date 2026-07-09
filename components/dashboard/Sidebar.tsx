'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import BrandLogo from '@/components/BrandLogo'
import { SUPORTE, whatsappUrl } from '@/lib/suporte'
import { hasFeedback } from '@/lib/feedback/access'
import { hasFinanceiro } from '@/lib/financeiro/supabaseStore'
import { contarCondutaNaoLidas } from '@/lib/conduta/unread'
import PreviewPlusModal from './PreviewPlusModal'

const COMPORTAMENTO_HREF = '/dashboard/comportamento'

interface Props {
  barbeariaNome: string
  onFerramentasClick?: () => void
  showFerramentas?: boolean
}

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  badge?: string
  // Itens marcados como adicional PLUS. Cadeado aparece se o usuario nao
  // tem acesso (nem grandfather nem grant ativo).
  requires?: 'feedback' | 'financeiro'
}

const navItems: NavItem[] = [
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
    href: '/dashboard/lancamento-diario',
    label: 'Lançamento diário',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </svg>
    ),
  },
  {
    href: '/dashboard/historico-lancamentos',
    label: 'Lançamento de pontos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/relatorio-pontos',
    label: 'Conferência de pontos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M9 17V7m4 10V11m4 6V9" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
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
  {
    href: '/dashboard/feedback-cliente',
    label: 'Feedback Premiado',
    badge: 'PLUS',
    requires: 'feedback',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/financeiro',
    label: 'Financeiro',
    badge: 'PLUS',
    requires: 'financeiro',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/comportamento',
    label: 'Comportamento',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    href: '/dashboard/como-usar',
    label: 'Como usar',
    badge: 'GUIA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    href: '/treinamentos',
    label: 'Aulas de uso',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar({ barbeariaNome, onFerramentasClick, showFerramentas = false }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Estado de acesso aos modulos PLUS. undefined = ainda verificando
  // (nao mostra cadeado nem nao-mostra, evita flash).
  const [access, setAccess] = useState<{
    feedback?: boolean
    financeiro?: boolean
  }>({})
  const [showPreview, setShowPreview] = useState(false)
  // Não lidas do módulo de comportamento (mensagens identificadas do barbeiro).
  const [condutaNaoLidas, setCondutaNaoLidas] = useState(0)

  useEffect(() => {
    let cancel = false
    Promise.all([hasFeedback(), hasFinanceiro()]).then(([f, fi]) => {
      if (!cancel) setAccess({ feedback: f, financeiro: fi })
    }).catch(() => { /* sem cadeado em caso de erro */ })
    return () => { cancel = true }
  }, [])

  // Reconta as não lidas a cada navegação (pathname muda) — reflete o dono
  // abrindo a caixa e lendo as mensagens.
  useEffect(() => {
    let cancel = false
    contarCondutaNaoLidas().then(n => { if (!cancel) setCondutaNaoLidas(n) }).catch(() => {})
    return () => { cancel = true }
  }, [pathname])

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
            const active = pathname === item.href && !showFerramentas
            // Cadeado: so se o item exige acesso E ja sabemos que nao tem.
            // Enquanto undefined (verificando), nao mostra nada — evita
            // flash visual.
            const locked = !!item.requires && access[item.requires] === false
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  // Bloqueado: intercepta e abre preview em vez de navegar.
                  if (locked) {
                    e.preventDefault()
                    setShowPreview(true)
                  }
                  setOpen(false)
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm
                  transition-colors
                  ${active
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'}
                `}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === COMPORTAMENTO_HREF && condutaNaoLidas > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shrink-0">
                    {condutaNaoLidas}
                  </span>
                )}
                {locked && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 shrink-0 text-[#D4A85A]/80"
                    aria-label="Bloqueado"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                {item.badge && (
                  <span
                    className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-[#D4A85A]/40 text-[#D4A85A]/80"
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Metas & Pontos button */}
          {onFerramentasClick && (
            <button
              onClick={() => { onFerramentasClick(); setOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-sm
                transition-colors text-left
                ${showFerramentas
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'}
              `}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Metas & Pontos
            </button>
          )}
        </nav>

        {/* Suporte */}
        <div className="p-3 border-t border-border">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl font-sans text-sm font-semibold transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
            </svg>
            <span className="flex-1 text-left">Suporte WhatsApp</span>
          </a>
          <p className="text-[10px] text-text-muted font-sans text-center mt-2">
            {SUPORTE.whatsappDisplay}
          </p>
        </div>

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

      <PreviewPlusModal open={showPreview} onClose={() => setShowPreview(false)} />
    </>
  )
}
