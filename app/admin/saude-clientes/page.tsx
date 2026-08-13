import Link from 'next/link'
import { redirect } from 'next/navigation'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { createClient } from '@/lib/supabase/server'
import { listarSaudeClientes } from './actions'
import SaudeClientesClient from './SaudeClientesClient'

export const metadata = { title: 'Admin — Saúde dos Clientes' }
export const dynamic = 'force-dynamic'

export default async function SaudeClientesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const { rows, error } = await listarSaudeClientes()

  return (
    <main className="bm-theme min-h-screen px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/dashboard" className="text-sm text-text-muted transition hover:text-text">
          ← Voltar para o painel
        </Link>

        <header className="mb-7 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Customer Success</p>
          <h1 className="mt-2 font-serif text-3xl text-text sm:text-4xl">Saúde dos Clientes</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
            Acompanhe adoção, frequência de uso e sinais de risco das barbearias em um só lugar.
            Os indicadores usam atividades que o BarberMeta já registra.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/[0.08] p-5 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <SaudeClientesClient rows={rows} />
        )}
      </div>
    </main>
  )
}
