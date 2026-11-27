import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarPedidosTarefix } from './actions'
import AdminTarefixClient from './AdminTarefixClient'

export const metadata = { title: 'Admin — Pagamentos do Tarefix' }
export const dynamic = 'force-dynamic'

export default async function AdminTarefixPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')
  const { pedidos } = await listarPedidosTarefix()
  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/tarefix" className="text-sm text-text-muted hover:text-text">← Voltar para Tarefix</Link>
        <div className="mb-8 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Pagamentos do Tarefix</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Confira o Pix no seu banco antes de liberar. Ao confirmar, a conta do dono ganha o Tarefix com o nome da barbearia informado no pedido.
          </p>
        </div>
        <AdminTarefixClient initialOrders={pedidos} />
      </div>
    </main>
  )
}
