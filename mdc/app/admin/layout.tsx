import Marca from '@/components/Marca'
import NavAdmin from '@/components/admin/NavAdmin'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — MDC', robots: { index: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-linha bg-fundo/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Marca href="/admin" pequeno />
          <div className="flex items-center gap-3 text-sm text-suave">
            <span className="hidden sm:inline">{user.email}</span>
            <form action="/sair" method="post">
              <button className="btn-sm border border-linha hover:border-latao/60">Sair</button>
            </form>
          </div>
        </div>
        <NavAdmin />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
