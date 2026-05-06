import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import LancamentoForm from '@/components/dashboard/LancamentoForm'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import CopiarLinkBtn from '@/components/dashboard/CopiarLinkBtn'
import EditarBarbeiroModal from '@/components/dashboard/EditarBarbeiroModal'
import LogoUpload from '@/components/dashboard/LogoUpload'
import FaturamentoEdit from '@/components/dashboard/FaturamentoEdit'
import BrandLogo from '@/components/BrandLogo'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

type UsuarioComBarbearia = {
  barbearia_id: string
  barbearias: { id: string; nome: string; logo_url: string | null }
}

type MetaSimples = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  faturamento_acumulado: number
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuarioRaw } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome, logo_url)')
    .eq('id', user.id)
    .single()

  const usuario = usuarioRaw as unknown as UsuarioComBarbearia | null
  if (!usuario) redirect('/login')

  const barbearia = usuario.barbearias
  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  // Busca meta coletiva (sem nested — nested join do Supabase pode falhar silenciosamente)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, faturamento_acumulado')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as MetaSimples | null

  // Busca metas individuais em query separada
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metasIndRaw } = meta ? await (supabase as any)
    .from('metas_individuais')
    .select('*')
    .eq('meta_id', meta.id) : { data: null }

  const metasIndividuais = (metasIndRaw ?? []) as MetaIndividual[]

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

  const totalComissoes = lancamentos.reduce((s: number, l: Lancamento) => s + l.comissao_acumulada, 0)
  const faturamentoExibido = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalComissoes
  const progressoColetivo = meta ? calcProgresso(faturamentoExibido, meta.meta_coletiva) : 0

  const ranking = [...barbeiros]
    .map(b => ({
      ...b,
      comissao: lancamentos.find(l => l.barbeiro_id === b.id)?.comissao_acumulada ?? 0,
      metaInd: metasIndividuais.find(m => m.barbeiro_id === b.id) ?? null,
    }))
    .sort((a, b) => b.comissao - a.comissao)

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoUpload logoUrl={barbearia.logo_url} nomeAbrev={barbearia.nome[0]} />
            <div>
              <BrandLogo size="md" />
              <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Ações */}
        <div className="flex gap-3 flex-wrap">
          <NovoBarbeiroModal />
          <MetasModal
            barbeiros={barbeiros}
            metasAtuais={metasIndividuais}
            metaColetiva={meta?.meta_coletiva}
            faturamentoAcumulado={meta?.faturamento_acumulado}
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
                <p className="text-text-muted text-sm font-sans mt-0.5">{nomeMes(mes)} {ano} · {meta.premio_coletivo}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-3xl text-text">{formatBRL(faturamentoExibido)}</p>
                <p className="text-text-muted text-sm font-sans">de {formatBRL(meta.meta_coletiva)}</p>
              </div>
            </div>
            <div className="bar-track h-5">
              <div
                className="bar-gold h-full rounded-full transition-all duration-700"
                style={{ width: `${progressoColetivo}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <FaturamentoEdit
                metaId={meta.id}
                faturamentoAtual={meta.faturamento_acumulado ?? 0}
                metaColetiva={meta.meta_coletiva}
                mes={mes}
                ano={ano}
              />
              <p className="text-text-muted text-xs font-sans">
                {progressoColetivo}% · faltam {formatBRL(Math.max(0, meta.meta_coletiva - faturamentoExibido))}
              </p>
            </div>
            {progressoColetivo < 20 && meta.meta_coletiva > 0 && (
              <p className="text-text-muted text-xs font-sans mt-3 text-center opacity-70">
                💪 A jornada começa agora — cada atendimento conta para a meta da equipe!
              </p>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-text-muted font-sans text-sm">
              Nenhuma meta configurada para {nomeMes(mes)} {ano}.{' '}
              <span className="text-primary">Configure as metas →</span>
            </p>
          </div>
        )}

        {/* Barbeiros */}
        <div>
          <h2 className="font-serif text-xl text-text mb-4">
            Ranking <span className="text-text-muted text-base font-sans">— {nomeMes(mes)} {ano}</span>
          </h2>

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
                    <div className="flex items-center gap-3">
                      <span className={`font-serif text-lg w-6 text-center shrink-0
                        ${idx === 0 ? 'metal-text-gold' : idx === 1 ? 'metal-text-silver' : idx === 2 ? 'metal-text-bronze' : 'text-text-muted'}`}>
                        {idx + 1}
                      </span>

                      <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-lg text-text-muted shrink-0 overflow-hidden">
                        {barbeiro.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
                        ) : barbeiro.nome[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-sans font-semibold text-text">{barbeiro.nome}</p>
                          <EditarBarbeiroModal barbeiro={barbeiro} />
                          {tier && (
                            <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                              ★ {TIER_CONFIG[tier].label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-text-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
                          <CopiarLinkBtn codigo={barbeiro.link_codigo} />
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-serif text-xl text-text">{formatBRL(barbeiro.comissao)}</p>
                        <LancamentoForm
                          barbeiro={barbeiro}
                          metaInd={barbeiro.metaInd ?? undefined}
                          comissaoAtual={barbeiro.comissao}
                        />
                      </div>
                    </div>

                    {/* Barras de progresso */}
                    <div className="mt-4">
                      {!barbeiro.metaInd ? (
                        <p className="text-text-muted text-xs font-sans opacity-50">
                          Sem metas configuradas — clique em &quot;Configurar metas&quot;
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {(['bronze', 'prata', 'ouro'] as const).map((t) => {
                            const commKey = `${t}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm'
                            const premioKey = `${t}_premio` as 'bronze_premio' | 'prata_premio' | 'ouro_premio'
                            const metaVal = barbeiro.metaInd![commKey]
                            const premio = barbeiro.metaInd![premioKey]
                            const semMeta = !metaVal || metaVal <= 0
                            const pct = progresso ? progresso[t] : 0

                            return (
                              <div key={t}>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className={`text-xs font-sans w-12 text-right shrink-0 ${semMeta ? 'text-text-muted opacity-30' : TIER_CONFIG[t].textClass}`}>
                                    {TIER_CONFIG[t].label}
                                  </span>
                                  <div className="bar-track flex-1 h-2.5">
                                    {!semMeta && (
                                      <div
                                        className={`${TIER_CONFIG[t].barClass} h-full rounded-full transition-all duration-700`}
                                        style={{ width: pct > 0 ? `${pct}%` : '3px' }}
                                      />
                                    )}
                                  </div>
                                </div>
                                {!semMeta && (
                                  <div className="ml-14 flex items-center gap-2">
                                    <span className="text-text-muted text-xs font-sans">{pct}%</span>
                                    {premio && <span className="text-text-muted text-xs font-sans opacity-60">· 🏆 {premio}</span>}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
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
