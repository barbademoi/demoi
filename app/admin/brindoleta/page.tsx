import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarPedidosBrindoleta } from './actions'
import AdminBrindoletaClient from './AdminBrindoletaClient'

export const metadata = { title: 'Admin — Pagamentos da Brindoleta' }
export const dynamic = 'force-dynamic'

export default async function AdminBrindoletaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const { orders } = await listarPedidosBrindoleta()

  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/brindoleta" className="text-sm text-text-muted hover:text-text">← Voltar para Brindoleta</Link>
        <div className="mb-8 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Pagamentos da Brindoleta</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Confira o Pix no seu banco antes de liberar. Clicar em “Já fiz o pagamento” nunca ativa o produto automaticamente.
          </p>
        </div>
        <AdminBrindoletaClient initialOrders={orders} />
      </div>
    </main>
  )
}
