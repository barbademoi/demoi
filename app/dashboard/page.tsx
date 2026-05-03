import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import type { BarbeiroComMeta, Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

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

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuarioRaw } = await supabase
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  const { data: metaRaw } = await supabase
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, metas_individuais(*)')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as unknown as MetaComIndividuais | null

  const { data: barbeirosRaw } = await supabase
    .from('barbeiros')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome')

  const { data: lancamentosRaw } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)

  const barbeirosBase = (barbeirosRaw ?? []) as Barbeiro[]
  const lancamentos = (lancamentosRaw ?? []) as Lancamento[]

  const barbeiros: BarbeiroComMeta[] = barbeirosBase.map((b) => {
    const lanc = lancamentos.find((l) => l.barbeiro_id === b.id)
    const metaInd = meta?.metas_individuais?.find((m) => m.barbeiro_id === b.id)
    const comissao = lanc?.comissao_acumulada ?? 0

    return {
      ...b,
      meta: metaInd,
      lancamento: lanc,
      progresso: metaInd ? {
        bronze: calcProgresso(comissao, metaInd.bronze_comm),
        prata:  calcProgresso(comissao, metaInd.prata_comm),
        ouro:   calcProgresso(comissao, metaInd.ouro_comm),
        tier_atual: calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm),
      } : undefined,
    }
  })

  const totalAcumulado = lancamentos.reduce((s, l) => s + l.comissao_acumulada, 0)
  const progressoColetivo = meta ? calcProgresso(totalAcumulado, meta.meta_coletiva) : 0

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-text">
              Barber<span className="metal-text-gold">Meta</span>
            </h1>
            <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm font-sans capitalize">
              {nomeMes(mes)} {ano}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-ghost text-sm py-1.5 px-3">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Meta Coletiva */}
        {meta && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl text-text">Meta Coletiva</h2>
                <p className="text-text-muted text-sm font-sans mt-0.5">{meta.premio_coletivo}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-2xl text-text">{formatBRL(totalAcumulado)}</p>
                <p className="text-text-muted text-sm font-sans">de {formatBRL(meta.meta_coletiva)}</p>
              </div>
            </div>
            <div className="bar-track h-4">
              <div
                className="bar-gold h-full rounded-full transition-all duration-700"
                style={{ width: `${progressoColetivo}%` }}
              />
            </div>
            <p className="text-text-muted text-xs font-sans mt-2 text-right">
              {progressoColetivo}% atingido
            </p>
          </div>
        )}

        {/* Barbeiros */}
        <div>
          <h2 className="font-serif text-xl text-text mb-4">Barbeiros</h2>
          <div className="space-y-3">
            {barbeiros.map((barbeiro) => (
              <div key={barbeiro.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-lg text-text-muted">
                      {barbeiro.nome[0]}
                    </div>
                    <div>
                      <p className="font-sans font-semibold text-text">{barbeiro.nome}</p>
                      <p className="text-text-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl text-text">
                      {formatBRL(barbeiro.lancamento?.comissao_acumulada ?? 0)}
                    </p>
                    {barbeiro.progresso?.tier_atual && (
                      <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[barbeiro.progresso.tier_atual].textClass}`}>
                        {TIER_CONFIG[barbeiro.progresso.tier_atual].label} ★
                      </span>
                    )}
                  </div>
                </div>

                {barbeiro.meta && barbeiro.progresso && (
                  <div className="space-y-2">
                    {(['bronze', 'prata', 'ouro'] as const).map((tier) => (
                      <div key={tier} className="flex items-center gap-3">
                        <span className={`text-xs font-sans w-12 text-right ${TIER_CONFIG[tier].textClass}`}>
                          {TIER_CONFIG[tier].label}
                        </span>
                        <div className="bar-track flex-1 h-2">
                          <div
                            className={`${TIER_CONFIG[tier].barClass} h-full rounded-full transition-all duration-700`}
                            style={{ width: `${barbeiro.progresso![tier]}%` }}
                          />
                        </div>
                        <span className="text-text-muted text-xs font-sans w-8 text-right">
                          {barbeiro.progresso![tier]}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
