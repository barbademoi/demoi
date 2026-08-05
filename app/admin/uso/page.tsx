import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarUsoBarbearias } from './actions'
import UsoClient from './UsoClient'

export const metadata = { title: 'Admin — Uso das barbearias' }
export const dynamic = 'force-dynamic'

const JANELAS = [30, 60, 90]

export default async function AdminUsoPage({
  searchParams,
}: {
  searchParams?: { dias?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const pedido = parseInt(searchParams?.dias ?? '', 10)
  const dias = JANELAS.includes(pedido) ? pedido : 30

  const { rows, error } = await listarUsoBarbearias(dias)

  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">← Voltar para o painel</Link>

        <div className="mb-8 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Uso das barbearias</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Quantos dos últimos {dias} dias cada barbearia teve atividade. Serve pra separar quem usa
            todo dia de quem comprou e parou.
          </p>

          <div className="mt-4 flex items-center gap-2">
            {JANELAS.map((j) => (
              <Link
                key={j}
                href={`/admin/uso?dias=${j}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  j === dias
                    ? 'border-primary/60 bg-primary/10 text-text'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {j} dias
              </Link>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <UsoClient rows={rows} dias={dias} />
        )}
      </div>
    </main>
  )
}
