import Marca from '@/components/Marca'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Área do membro — MDC', robots: { index: false } }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-linha">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Marca href="/app" pequeno />
          <form action="/sair" method="post">
            <button className="btn-sm border border-linha">Sair</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
