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
  Star,
  BookOpen,
  Mail,
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
  { href: '/painel/profissionais', label: 'Colaboradores', icon: Users },
  { href: '/painel/feedback/novo', label: 'Registrar observação', icon: MessageSquarePlus },
  { href: '/painel/reuniao', label: 'Preparar Reunião', icon: ClipboardList },
  { href: '/painel/atividade', label: 'Atividade da Equipe', icon: Inbox },
  { href: '/painel/feedbacks-cliente', label: 'Feedback de Clientes', icon: Star },
  { href: '/painel/mensagens', label: 'Mensagens', icon: Mail },
  { href: '/painel/historico-reunioes', label: 'Histórico', icon: History },
  { href: '/painel/tutoriais', label: 'Tutoriais', icon: BookOpen },
]

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || 'B'
}

export default function Sidebar({
  nomeEstab,
  email,
  logoUrl,
  novas,
  mensagensNaoLidas = 0,
}: {
  nomeEstab: string
  email: string
  logoUrl?: string | null
  novas: number
  mensagensNaoLidas?: number
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
      <Link href="/painel" className="flex items-center gap-2.5 px-1 pb-4 min-w-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover bg-linho shrink-0"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logos/logo-simbolo.svg"
            alt="Bússola"
            className="w-10 h-10 rounded-full shrink-0"
          />
        )}
        <span className="min-w-0">
          <span className="block font-serif text-xl text-preto leading-tight">Bússola</span>
          <span className="block text-xs text-chumbo truncate">{nomeEstab}</span>
        </span>
      </Link>
      <div className="border-t border-border -mx-4 mb-4" />

      {/* Menu */}
      <nav className="space-y-1 flex-1">
        {ITENS.map((i) => {
          const on = ativo(i)
          const Icon = i.icon
          const badge =
            i.href === '/painel/atividade'
              ? novas
              : i.href === '/painel/mensagens'
                ? mensagensNaoLidas
                : 0
          return (
            <Link key={i.href} href={i.href} className={itemClasses(on)}>
              {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-marrom" />}
              <Icon size={24} strokeWidth={1.5} color={on ? '#8B6F47' : '#8A8A8A'} />
              <span>{i.label}</span>
              {badge > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-marrom text-white text-[10px] font-bold flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
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
