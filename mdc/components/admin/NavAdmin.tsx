'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const LINKS_ADMIN = [
  { href: '/admin/leads', rotulo: 'Leads' },
  { href: '/admin/membros', rotulo: 'Membros' },
  { href: '/admin/vencimentos', rotulo: 'Vencimentos' },
  { href: '/admin/diagnosticos', rotulo: 'Diagnósticos' },
  { href: '/admin/vendas', rotulo: 'Página de vendas' },
  { href: '/admin/configuracoes', rotulo: 'Textos e links' },
]

export default function NavAdmin() {
  const path = usePathname()
  return (
    <nav className="mx-auto max-w-6xl overflow-x-auto px-4">
      <ul className="flex gap-1 whitespace-nowrap pb-2">
        {LINKS_ADMIN.map((l) => {
          const ativo = path === l.href || path.startsWith(l.href + '/')
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`inline-flex min-h-[40px] items-center rounded-xl px-3.5 text-sm font-semibold ${
                  ativo ? 'bg-latao text-fundo' : 'text-suave hover:bg-card hover:text-texto'
                }`}
              >
                {l.rotulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
