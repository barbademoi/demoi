'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  MessageSquarePlus,
  ClipboardList,
  Inbox,
  History,
  Settings,
  ChevronUp,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { sair } from '@/app/painel/actions'

interface Item {
  href: string
  label: string
  icon: LucideIcon
  exato?: boolean
}

const ITENS: Item[] = [
  { href: '/painel', label: 'Home', icon: Home, exato: true },
  { href: '/painel/profissionais', label: 'Profissionais', icon: Users },
  { href: '/painel/feedback/novo', label: 'Registrar Feedback', icon: MessageSquarePlus },
  { href: '/painel/reuniao', label: 'Preparar Reunião', icon: ClipboardList },
  { href: '/painel/atividade', label: 'Atividade da Equipe', icon: Inbox },
  { href: '/painel/historico-reunioes', label: 'Histórico', icon: History },
]

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'B'
}

export default function Sidebar({
  nomeEstab,
  email,
  novas,
}: {
  nomeEstab: string
  email: string
  novas: number
}) {
  const pathname = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href))

  const itemClasses = (on: boolean) =>
    [
      'relative flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
      on ? 'bg-linho text-marrom' : 'text-grafite hover:bg-linho',
    ].join(' ')

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-border bg-surface sticky top-0 h-screen p-4">
      {/* Logo */}
      <Link href="/painel" className="block px-1 pb-4">
        <span className="font-serif text-2xl text-preto leading-none">Bússola</span>
      </Link>
      <div className="border-t border-border -mx-4 mb-4" />

      {/* Menu */}
      <nav className="space-y-1 flex-1">
        {ITENS.map((i) => {
          const on = ativo(i)
          const Icon = i.icon
          const isAtividade = i.href === '/painel/atividade'
          return (
            <Link key={i.href} href={i.href} className={itemClasses(on)}>
              {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-marrom" />}
              <Icon size={24} strokeWidth={1.5} color={on ? '#8B6F47' : '#8A8A8A'} />
              <span>{i.label}</span>
              {isAtividade && novas > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-marrom text-white text-[10px] font-bold flex items-center justify-center">
                  {novas > 9 ? '9+' : novas}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-border -mx-4 pt-3 px-4 mt-3 space-y-1">
        <Link href="/painel/configuracoes" className={itemClasses(pathname.startsWith('/painel/configuracoes'))}>
          {pathname.startsWith('/painel/configuracoes') && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-marrom" />
          )}
          <Settings size={24} strokeWidth={1.5} color={pathname.startsWith('/painel/configuracoes') ? '#8B6F47' : '#8A8A8A'} />
          <span>Configurações</span>
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-linho transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-marrom text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {iniciais(nomeEstab)}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-medium text-text truncate">{nomeEstab}</span>
              <span className="block text-xs text-chumbo truncate">{email}</span>
            </span>
            <ChevronUp size={18} strokeWidth={1.5} color="#8A8A8A" className={menuAberto ? '' : 'rotate-180 transition-transform'} />
          </button>

          {menuAberto && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border border-border bg-surface shadow-media py-1">
              <form action={sair}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-grafite hover:bg-linho transition-colors"
                >
                  <LogOut size={18} strokeWidth={1.5} color="#8A8A8A" />
                  Sair
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
