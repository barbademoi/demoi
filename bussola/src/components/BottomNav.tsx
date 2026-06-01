'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  MessageSquarePlus,
  Inbox,
  Menu,
  ClipboardList,
  History,
  Settings,
  LogOut,
  Star,
  X,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { sair } from '@/app/painel/actions'

interface Item {
  href: string
  label: string
  icon: LucideIcon
  exato?: boolean
}

const PRINCIPAIS: Item[] = [
  { href: '/painel', label: 'Início', icon: Home, exato: true },
  { href: '/painel/profissionais', label: 'Colaboradores', icon: Users },
]

const SECUNDARIOS: Item[] = [
  { href: '/painel/reuniao', label: 'Preparar Reunião', icon: ClipboardList },
  { href: '/painel/feedbacks-cliente', label: 'Feedback de Clientes', icon: Star },
  { href: '/painel/historico-reunioes', label: 'Histórico', icon: History },
  { href: '/painel/tutoriais', label: 'Tutoriais', icon: BookOpen },
  { href: '/painel/configuracoes', label: 'Configurações', icon: Settings },
]

export default function BottomNav({ novas }: { novas: number }) {
  const pathname = usePathname()
  const [drawer, setDrawer] = useState(false)
  const ativo = (i: Item) => (i.exato ? pathname === i.href : pathname.startsWith(i.href))

  const Item = ({ i, badge }: { i: Item; badge?: number }) => {
    const on = ativo(i)
    const Icon = i.icon
    return (
      <Link
        href={i.href}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative"
      >
        <Icon size={22} strokeWidth={1.5} color={on ? '#8B6F47' : '#8A8A8A'} />
        <span className={`text-[11px] font-medium ${on ? 'text-marrom' : 'text-chumbo'}`}>{i.label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1 right-1/2 translate-x-3 min-w-[16px] h-[16px] px-1 rounded-full bg-marrom text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-surface border-t border-border flex items-stretch shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <Item i={PRINCIPAIS[0]} />
        <Item i={PRINCIPAIS[1]} />

        {/* Botão central de destaque */}
        <div className="flex-1 flex items-start justify-center">
          <Link
            href="/painel/feedback/novo"
            aria-label="Registrar observação"
            className="-mt-5 w-14 h-14 rounded-full bg-marrom text-white flex items-center justify-center shadow-media active:bg-marrom-escuro transition-colors"
          >
            <MessageSquarePlus size={28} strokeWidth={1.5} color="#FFFFFF" />
          </Link>
        </div>

        <Item i={{ href: '/painel/atividade', label: 'Atividade', icon: Inbox }} badge={novas} />

        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
        >
          <Menu size={22} strokeWidth={1.5} color="#8A8A8A" />
          <span className="text-[11px] font-medium text-chumbo">Mais</span>
        </button>
      </nav>

      {/* Drawer "Mais" */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setDrawer(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-4 pb-8 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif text-xl text-preto">Bússola</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Fechar">
                <X size={22} strokeWidth={1.5} color="#8A8A8A" />
              </button>
            </div>
            <div className="space-y-1">
              {SECUNDARIOS.map((i) => {
                const Icon = i.icon
                const on = ativo(i)
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setDrawer(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${on ? 'bg-linho text-marrom' : 'text-grafite hover:bg-linho'}`}
                  >
                    <Icon size={22} strokeWidth={1.5} color={on ? '#8B6F47' : '#8A8A8A'} />
                    {i.label}
                  </Link>
                )
              })}
              <form action={sair}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-grafite hover:bg-linho transition-colors"
                >
                  <LogOut size={22} strokeWidth={1.5} color="#8A8A8A" />
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
