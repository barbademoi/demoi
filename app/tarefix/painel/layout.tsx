import { exigirDono } from '@/lib/tarefix/dono'
import { Nav } from '@/components/tarefix/Nav'
import { Logo } from '@/components/tarefix/Logo'

export const dynamic = 'force-dynamic'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { empresa } = await exigirDono()
  return (
    <div className="min-h-dvh lg:pl-60">
      <header className="flex items-center justify-between px-4 pt-5 lg:hidden">
        <Logo className="text-2xl" />
        <span className="max-w-[50%] truncate text-sm text-tf-suave">{empresa.nome}</span>
      </header>
      <Nav nomeEmpresa={empresa.nome} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 lg:px-8 lg:pb-12 lg:pt-10">{children}</main>
    </div>
  )
}
