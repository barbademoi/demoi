import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { emailEhAdminCortesia } from '@/lib/admin/cortesia'
import { listarCrescimentoBarbearias } from './actions'
import { FILTROS_PADRAO } from './filtros'
import CrescimentoClient from './CrescimentoClient'

export const metadata = { title: 'Admin — Crescimento das barbearias' }
export const dynamic = 'force-dynamic'

// Pisos configuráveis pela URL, com os defaults do produto.
const OPCOES = {
  piso:         [0, 1000, 1500, 3000, 5000],
  diasMinimos:  [0, 5, 10, 15, 20],
  mesesMinimos: [2, 3, 4, 6],
  ciclos:       [6, 9, 12],
}

function Chips({
  label, atual, opcoes, chave, base, fmt,
}: {
  label: string
  atual: number
  opcoes: number[]
  chave: string
  base: Record<string, number>
  fmt: (v: number) => string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-text-muted">{label}</span>
      {opcoes.map((v) => {
        const params = new URLSearchParams(
          Object.entries({ ...base, [chave]: v }).map(([k, val]) => [k, String(val)]),
        )
        return (
          <Link
            key={v}
            href={`/admin/crescimento?${params.toString()}`}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              v === atual
                ? 'border-primary/60 bg-primary/10 text-text'
                : 'border-border text-text-muted hover:text-text'
            }`}
          >
            {fmt(v)}
          </Link>
        )
      })}
    </div>
  )
}

export default async function AdminCrescimentoPage({
  searchParams,
}: {
  searchParams?: { ciclos?: string; piso?: string; dias?: string; meses?: string; outlier?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!emailEhAdminCortesia(user.email)) redirect('/dashboard')

  const { rows, filtros, error } = await listarCrescimentoBarbearias({
    ciclos:       Number(searchParams?.ciclos),
    piso:         Number(searchParams?.piso),
    diasMinimos:  Number(searchParams?.dias),
    mesesMinimos: Number(searchParams?.meses),
    outlierPct:   Number(searchParams?.outlier),
  })

  // Base pra montar os links de filtro preservando as demais escolhas.
  const base = {
    ciclos: filtros.ciclos,
    piso: filtros.piso,
    dias: filtros.diasMinimos,
    meses: filtros.mesesMinimos,
    outlier: filtros.outlierPct,
  }

  const padrao =
    filtros.piso === FILTROS_PADRAO.piso &&
    filtros.diasMinimos === FILTROS_PADRAO.diasMinimos &&
    filtros.mesesMinimos === FILTROS_PADRAO.mesesMinimos &&
    filtros.ciclos === FILTROS_PADRAO.ciclos

  return (
    <main className="bm-theme min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">← Voltar para o painel</Link>

        <div className="mb-6 mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="mt-2 font-serif text-3xl text-text">Crescimento das barbearias</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Só barbearias com histórico confiável entram na conta: mês fechado, acima do piso e com
            lançamento frequente. As demais ficam separadas embaixo, fora das estatísticas.
          </p>
        </div>

        <div className="card mb-5 space-y-3 p-4">
          <Chips label="Piso por mês" atual={filtros.piso} opcoes={OPCOES.piso} chave="piso" base={base}
                 fmt={(v) => (v === 0 ? 'sem piso' : `R$ ${v.toLocaleString('pt-BR')}`)} />
          <Chips label="Dias mínimos" atual={filtros.diasMinimos} opcoes={OPCOES.diasMinimos} chave="dias" base={base}
                 fmt={(v) => (v === 0 ? 'sem mínimo' : `${v} dias`)} />
          <Chips label="Meses mínimos" atual={filtros.mesesMinimos} opcoes={OPCOES.mesesMinimos} chave="meses" base={base}
                 fmt={(v) => `${v} meses`} />
          <Chips label="Janela" atual={filtros.ciclos} opcoes={OPCOES.ciclos} chave="ciclos" base={base}
                 fmt={(v) => `${v} ciclos`} />
          {!padrao && (
            <Link href="/admin/crescimento" className="inline-block text-xs text-text-muted underline hover:text-text">
              Voltar aos padrões (R$ {FILTROS_PADRAO.piso.toLocaleString('pt-BR')} · {FILTROS_PADRAO.diasMinimos} dias · {FILTROS_PADRAO.mesesMinimos} meses)
            </Link>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-400/[0.08] p-4 text-sm text-red-200">
            {error}
          </div>
        ) : (
          <CrescimentoClient rows={rows} filtros={filtros} />
        )}
      </div>
    </main>
  )
}
