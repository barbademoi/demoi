import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarAssinantes } from './actions'
import AssinaturasClient from './AssinaturasClient'

export const metadata = { title: 'Admin — Assinaturas' }
export const dynamic = 'force-dynamic'

export default async function AdminAssinaturasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const { rows, error } = await listarAssinantes()

  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">← Voltar para o painel</Link>

        <div className="mb-6 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Assinaturas</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Quem está vencendo, quem está em carência e quem já foi bloqueado — com as ações de exceção.
            Clientes vitalícios não aparecem aqui: eles nunca são checados por validade.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-200">{error}</div>
        ) : (
          <AssinaturasClient rows={rows} />
        )}
      </div>
    </main>
  )
}
