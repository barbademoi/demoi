import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import LancamentoForm from '@/components/dashboard/LancamentoForm'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

type UsuarioComBarbearia = {
  barbearia_id: string
  barbearias: { id: string; nome: string }
}

type MetaComIndividuais = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  metas_individuais: MetaIndividual[]
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { mes?: string; ano?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const hoje = new Date()
  const mes = parseInt(searchParams.mes ?? String(hoje.getMonth() + 1))
  const ano = parseInt(searchParams.ano ?? String(hoje.getFullYear()))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, metas_individuais(*)')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as unknown as MetaComIndividuais | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeirosRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancamentosRaw } = await (supabase as any)
    .from('lancamentos')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const barbeiros = (barbeirosRaw ?? []) as Barbeiro[]
  const lancamentos = (lancamentosRaw ?? []) as Lancamento[]

  const totalAcumulado = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const progressoColetivo = meta ? calcProgresso(totalAcumulado, meta.meta_coletiva) : 0

  // Monta ranking
  const ranking = [...barbeiros]
    .map(b => ({
      ...b,
      comissao: lancamentos.find(l => l.barbeiro_id === b.id)?.comissao_acumulada ?? 0,
      metaInd: meta?.metas_individuais?.find(m => m.barbeiro_id === b.id),
      lancamento: lancamentos.find(l => l.barbeiro_id === b.id),
    }))
    .sort((a, b) => b.comissao - a.comissao)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-text">
              Barber<span className="metal-text-gold">Meta</span>
            </h1>
            <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Seletor mês/ano */}
            <MesSelector mes={mes} ano={ano} />
            <Link href="/cards" className="btn-ghost text-sm py-2 px-3 border border-border">
              Cards PNG
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-ghost text-sm py-2 px-3">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Ações rápidas */}
        <div className="flex gap-3 flex-wrap">
          <NovoBarbeiroModal />
          <MetasModal
            barbeiros={barbeiros}
            metasAtuais={meta?.metas_individuais}
            metaColetiva={meta?.meta_coletiva}
            premioColetivo={meta?.premio_coletivo ?? undefined}
            mes={mes}
            ano={ano}
          />
        </div>

        {/* Meta Coletiva */}
        {meta ? (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-text">Meta Coletiva</h2>
                <p className="text-text-muted text-sm font-sans mt-0.5">{meta.premio_coletivo}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-3xl text-text">{formatBRL(totalAcumulado)}</p>
                <p className="text-text-muted text-sm font-sans">de {formatBRL(meta.meta_coletiva)}</p>
              </div>
            </div>
            <div className="bar-track h-5">
              <div
                className="bar-gold h-full rounded-full transition-all duration-700"
                style={{ width: `${progressoColetivo}%` }}
              />
            </div>
            <p className="text-text-muted text-xs font-sans mt-2 text-right">
              {progressoColetivo}% · faltam {formatBRL(Math.max(0, meta.meta_coletiva - totalAcumulado))}
            </p>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-text-muted font-sans text-sm">
              Nenhuma meta configurada para {nomeMes(mes)} {ano}.
              <span className="text-primary cursor-pointer ml-1">Configure as metas →</span>
            </p>
          </div>
        )}

        {/* Barbeiros */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-text">
              Barbeiros <span className="text-text-muted text-base font-sans">({barbeiros.length})</span>
            </h2>
            <p className="text-text-muted text-sm font-sans capitalize">{nomeMes(mes)} {ano}</p>
          </div>

          {barbeiros.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-text-muted font-sans text-sm">
                Nenhum barbeiro cadastrado. Clique em &ldquo;+ Novo barbeiro&rdquo; para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((barbeiro, idx) => {
                const tier = barbeiro.metaInd
                  ? calcTier(barbeiro.comissao, barbeiro.metaInd.bronze_comm, barbeiro.metaInd.prata_comm, barbeiro.metaInd.ouro_comm)
                  : null
                const progresso = barbeiro.metaInd ? {
                  bronze: calcProgresso(barbeiro.comissao, barbeiro.metaInd.bronze_comm),
                  prata:  calcProgresso(barbeiro.comissao, barbeiro.metaInd.prata_comm),
                  ouro:   calcProgresso(barbeiro.comissao, barbeiro.metaInd.ouro_comm),
                } : null

                return (
                  <div key={barbeiro.id} className="card p-5">
                    {/* Linha principal */}
                    <div className="flex items-center gap-3">
                      {/* Posição no ranking */}
                      <span className={`font-serif text-lg w-6 text-center shrink-0
                        ${idx === 0 ? 'metal-text-gold' : idx === 1 ? 'metal-text-silver' : idx === 2 ? 'metal-text-bronze' : 'text-text-muted'}`}>
                        {idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-lg text-text-muted shrink-0">
                        {barbeiro.nome[0]}
                      </div>

                      {/* Nome e link */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-sans font-semibold text-text">{barbeiro.nome}</p>
                          {tier && (
                            <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                              ★ {TIER_CONFIG[tier].label}
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted text-xs font-sans truncate">/b/{barbeiro.link_codigo}</p>
                      </div>

                      {/* Comissão + botão lançar */}
                      <div className="text-right shrink-0">
                        <p className="font-serif text-xl text-text">{formatBRL(barbeiro.comissao)}</p>
                        <LancamentoForm
                          barbeiro={barbeiro}
                          metaInd={barbeiro.metaInd}
                          comissaoAtual={barbeiro.comissao}
                        />
                      </div>
                    </div>

                    {/* Barras */}
                    {barbeiro.metaInd && progresso && (
                      <div className="mt-4 space-y-2">
                        {(['bronze', 'prata', 'ouro'] as const).map((t) => (
                          <div key={t} className="flex items-center gap-3">
                            <span className={`text-xs font-sans w-12 text-right shrink-0 ${TIER_CONFIG[t].textClass}`}>
                              {TIER_CONFIG[t].label}
                            </span>
                            <div className="bar-track flex-1 h-2">
                              <div
                                className={`${TIER_CONFIG[t].barClass} h-full rounded-full transition-all duration-700`}
                                style={{ width: `${progresso[t]}%` }}
                              />
                            </div>
                            <span className="text-text-muted text-xs font-sans w-8 text-right shrink-0">
                              {progresso[t]}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

// Componente inline de seletor de mês
function MesSelector({ mes, ano }: { mes: number; ano: number }) {
  const meses = [1,2,3,4,5,6,7,8,9,10,11,12]
  const anos = [2024, 2025, 2026]

  return (
    <div className="flex gap-1">
      <select
        name="mes"
        defaultValue={mes}
        onChange={e => {
          const url = new URL(window.location.href)
          url.searchParams.set('mes', e.target.value)
          window.location.href = url.toString()
        }}
        className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary cursor-pointer"
        suppressHydrationWarning
      >
        {meses.map(m => (
          <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
        ))}
      </select>
      <select
        name="ano"
        defaultValue={ano}
        onChange={e => {
          const url = new URL(window.location.href)
          url.searchParams.set('ano', e.target.value)
          window.location.href = url.toString()
        }}
        className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary cursor-pointer"
        suppressHydrationWarning
      >
        {anos.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
