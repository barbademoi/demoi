import Marca from '@/components/Marca'
import NavMembro from '@/components/app/NavMembro'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Área do membro — MDC', robots: { index: false } }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 sm:pb-8">
      <header className="sticky top-0 z-20 border-b border-linha bg-fundo/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Marca href="/app" pequeno />
          <NavMembro modo="topo" />
          <form action="/sair" method="post">
            <button className="btn-sm border border-linha text-suave">Sair</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <NavMembro modo="base" />
    </div>
  )
}
