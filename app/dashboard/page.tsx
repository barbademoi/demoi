import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import LancamentoForm from '@/components/dashboard/LancamentoForm'
import NovoBarbeiroModal from '@/components/dashboard/NovoBarbeiroModal'
import MetasModal from '@/components/dashboard/MetasModal'
import CopiarLinkBtn from '@/components/dashboard/CopiarLinkBtn'
import EditarBarbeiroModal from '@/components/dashboard/EditarBarbeiroModal'
import LogoUpload from '@/components/dashboard/LogoUpload'
import FaturamentoEdit from '@/components/dashboard/FaturamentoEdit'
import BrandLogo from '@/components/BrandLogo'
import ModoMesSelector from '@/components/dashboard/ModoMesSelector'
import CampanhaModal from '@/components/dashboard/CampanhaModal'
import CampanhaToggle from '@/components/dashboard/CampanhaToggle'
import Sidebar from '@/components/dashboard/Sidebar'
import type { Barbeiro, MetaIndividual, Lancamento, ModoPontos, CampanhaComDetalhes, CampanhaServico, CampanhaPremio, ControleDiario } from '@/types/database'

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
  const diaAtual = hoje.getDate()
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const diasRestantes = diasNoMes - diaAtual

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, faturamento_acumulado')
    .eq('barbearia_id', barbearia.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as MetaSimples | null

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

  // ── Cálculos gerais ─────────────────────────────────────
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

  const rankingBarbeiros = ranking.filter(b => b.tipo !== 'recepcionista')
  const rankingRecepcionistas = ranking.filter(b => b.tipo === 'recepcionista')

  // ── Gamificação ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modoRaw } = await (supabase as any)
    .from('modo_mes').select('modo').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
  const modoAtual: ModoPontos = (modoRaw?.modo as ModoPontos) ?? 'metas'

  let campanha: CampanhaComDetalhes | null = null
  let pontosMap: Record<string, number> = {}

  if (modoAtual !== 'metas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: campRaw } = await (supabase as any)
      .from('campanha').select('*').eq('barbearia_id', barbearia.id).eq('mes', mes).eq('ano', ano).single()
    if (campRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: servicosRaw } = await (supabase as any)
        .from('campanha_servicos').select('*').eq('campanha_id', campRaw.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: premiosRaw } = await (supabase as any)
        .from('campanha_premios').select('*').eq('campanha_id', campRaw.id).order('posicao')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: controlesRaw } = await (supabase as any)
        .from('controle_diario').select('barbeiro_id, servico_id, quantidade').eq('campanha_id', campRaw.id)
      campanha = {
        ...campRaw,
        campanha_servicos: (servicosRaw ?? []) as CampanhaServico[],
        campanha_premios:  (premiosRaw  ?? []) as CampanhaPremio[],
      }
      const servicos = campanha!.campanha_servicos
      for (const cd of ((controlesRaw ?? []) as Pick<ControleDiario, 'barbeiro_id' | 'servico_id' | 'quantidade'>[])) {
        const pts = servicos.find(s => s.id === cd.servico_id)?.pontos ?? 0
        pontosMap[cd.barbeiro_id] = (pontosMap[cd.barbeiro_id] ?? 0) + cd.quantidade * pts
      }
    }
  }

  const rankingPontos = Object.entries(pontosMap)
    .map(([id, pts]) => ({ id, pts }))
    .sort((a, b) => b.pts - a.pts)

  const rankingPontosBarb  = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo !== 'recepcionista')
  const rankingPontosRecep = rankingPontos.filter(r => barbeiros.find(b => b.id === r.id)?.tipo === 'recepcionista')

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />

      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        {/* Desktop header strip */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-4 border-b border-border">
          <LogoUpload logoUrl={barbearia.logo_url} nomeAbrev={barbearia.nome[0]} />
          <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>
        </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Modo do mês */}
        <ModoMesSelector modoAtual={modoAtual} mes={mes} ano={ano} />

        {/* Ações */}
        <div className="flex gap-3 flex-wrap">
          <NovoBarbeiroModal />
          <NovoBarbeiroModal tipo="recepcionista" />
          {modoAtual !== 'pontos' && (
            <MetasModal
              barbeiros={barbeiros}
              metasAtuais={metasIndividuais}
              metaColetiva={meta?.meta_coletiva}
              faturamentoAcumulado={meta?.faturamento_acumulado}
              premioColetivo={meta?.premio_coletivo ?? undefined}
              mes={mes}
              ano={ano}
            />
          )}
          {modoAtual !== 'metas' && (
            <CampanhaModal campanha={campanha} mes={mes} ano={ano} />
          )}
          {modoAtual !== 'metas' && campanha && (
            <CampanhaToggle campanhaId={campanha.id} ativo={campanha.ativo} />
          )}
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
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressoColetivo}%`,
                  background: `hsl(${Math.round(progressoColetivo * 1.2)}, 80%, 42%)`,
                  boxShadow: `0 0 14px 4px hsla(${Math.round(progressoColetivo * 1.2)}, 80%, 42%, 0.5)`,
                }}
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

            {/* Contagem regressiva coletiva (2D) */}
            {diasRestantes > 0 && meta.meta_coletiva > 0 && faturamentoExibido < meta.meta_coletiva && (() => {
              const falta = meta.meta_coletiva - faturamentoExibido
              const necesarioPorDia = falta / diasRestantes
              const ritmoColetivo = diaAtual > 0 ? faturamentoExibido / diaAtual : 0
              const ok = ritmoColetivo >= necesarioPorDia
              return (
                <div className="mt-4 border-t border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-text-muted text-xs font-sans">
                      Faltam <span className="text-text font-semibold">{diasRestantes} dias</span>
                    </p>
                    <p className={`text-xs font-sans font-semibold ${ok ? 'text-green-400' : 'text-amber-400'}`}>
                      {ok ? '✅ No ritmo' : '⚠️ Acelerar'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-xs font-sans">Necessário/dia</p>
                      <p className="font-serif text-xl text-text">{formatBRL(necesarioPorDia)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-xs font-sans">Ritmo atual</p>
                      <p className={`font-serif text-xl ${ok ? 'text-green-400' : 'text-amber-400'}`}>
                        {formatBRL(ritmoColetivo)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
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
            Barbeiros <span className="text-text-muted text-base font-sans">— {nomeMes(mes)} {ano}</span>
          </h2>

          {rankingBarbeiros.length === 0 ? (
            <div className="card-light p-8 text-center">
              <p className="text-on-cream-muted font-sans text-sm">
                Nenhum barbeiro cadastrado. Clique em &ldquo;+ Barbeiro&rdquo; para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankingBarbeiros.map((barbeiro, idx) => {
                const tier = barbeiro.metaInd
                  ? calcTier(barbeiro.comissao, barbeiro.metaInd.bronze_comm, barbeiro.metaInd.prata_comm, barbeiro.metaInd.ouro_comm)
                  : null
                const progresso = barbeiro.metaInd ? {
                  bronze: calcProgresso(barbeiro.comissao, barbeiro.metaInd.bronze_comm),
                  prata:  calcProgresso(barbeiro.comissao, barbeiro.metaInd.prata_comm),
                  ouro:   calcProgresso(barbeiro.comissao, barbeiro.metaInd.ouro_comm),
                } : null
                const pts = pontosMap[barbeiro.id] ?? 0
                const posicaoPts = rankingPontosBarb.findIndex(r => r.id === barbeiro.id)
                const qualificado = campanha ? pts >= campanha.min_pontos : false

                return (
                  <div key={barbeiro.id} className="card-light p-5">
                    <div className="flex items-center gap-3">
                      <span className={`font-serif text-lg w-6 text-center shrink-0
                        ${idx === 0 ? 'metal-text-gold' : idx === 1 ? 'metal-text-silver' : idx === 2 ? 'metal-text-bronze' : 'text-on-cream-muted'}`}>
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-cream-surface border border-cream-border flex items-center justify-center font-serif text-lg text-on-cream-muted shrink-0 overflow-hidden">
                        {barbeiro.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
                        ) : barbeiro.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-sans font-semibold text-on-cream">{barbeiro.nome}</p>
                          <EditarBarbeiroModal barbeiro={barbeiro} />
                          {tier && (
                            <span className={`text-xs font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                              ★ {TIER_CONFIG[tier].label}
                            </span>
                          )}
                          {modoAtual !== 'metas' && campanha && (
                            <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full
                              ${qualificado ? 'bg-primary/10 text-primary' : 'bg-cream-surface text-on-cream-muted'}`}>
                              🏅 {pts} pts {posicaoPts >= 0 && qualificado ? `· #${posicaoPts + 1}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-on-cream-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
                          <CopiarLinkBtn codigo={barbeiro.link_codigo} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {modoAtual !== 'pontos' && (
                          <p className="font-serif text-xl text-on-cream">{formatBRL(barbeiro.comissao)}</p>
                        )}
                        {modoAtual === 'pontos' && (
                          <p className="font-serif text-xl text-on-cream">{pts} pts</p>
                        )}
                        {modoAtual !== 'pontos' && (
                          <LancamentoForm
                            barbeiro={barbeiro}
                            metaInd={barbeiro.metaInd ?? undefined}
                            comissaoAtual={barbeiro.comissao}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {!barbeiro.metaInd ? (
                        <p className="text-on-cream-muted text-xs font-sans opacity-50">
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
                                  <span className={`text-xs font-sans w-12 text-right shrink-0 ${semMeta ? 'text-on-cream-muted opacity-30' : TIER_CONFIG[t].textClass}`}>
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
                                    <span className="text-on-cream-muted text-xs font-sans">{pct}%</span>
                                    {premio && <span className="text-on-cream-muted text-xs font-sans opacity-60">· 🏆 {premio}</span>}
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

        {/* Recepcionistas */}
        <div>
          <h2 className="font-serif text-xl text-text mb-4">Recepcionistas</h2>

          {rankingRecepcionistas.length === 0 ? (
            <div className="card-light p-8 text-center">
              <p className="text-on-cream-muted font-sans text-sm">
                Nenhuma recepcionista cadastrada. Clique em &ldquo;+ Recepcionista&rdquo; para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankingRecepcionistas.map((barbeiro, idx) => {
                const pts = pontosMap[barbeiro.id] ?? 0
                const posicaoPts = rankingPontosRecep.findIndex(r => r.id === barbeiro.id)
                const minPtsRecep = campanha?.min_pontos_recep ?? 400
                const qualificado = campanha ? pts >= minPtsRecep : false

                return (
                  <div key={barbeiro.id} className="card-light p-5">
                    <div className="flex items-center gap-3">
                      <span className={`font-serif text-lg w-6 text-center shrink-0
                        ${idx === 0 ? 'metal-text-gold' : idx === 1 ? 'metal-text-silver' : idx === 2 ? 'metal-text-bronze' : 'text-on-cream-muted'}`}>
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-cream-surface border border-cream-border flex items-center justify-center font-serif text-lg text-on-cream-muted shrink-0 overflow-hidden">
                        {barbeiro.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
                        ) : barbeiro.nome[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-sans font-semibold text-on-cream">{barbeiro.nome}</p>
                          <EditarBarbeiroModal barbeiro={barbeiro} />
                          {modoAtual !== 'metas' && campanha && (
                            <span className={`text-xs font-sans font-semibold px-2 py-0.5 rounded-full
                              ${qualificado ? 'bg-primary/10 text-primary' : 'bg-cream-surface text-on-cream-muted'}`}>
                              🏅 {pts} pts {posicaoPts >= 0 && qualificado ? `· #${posicaoPts + 1}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-on-cream-muted text-xs font-sans">/b/{barbeiro.link_codigo}</p>
                          <CopiarLinkBtn codigo={barbeiro.link_codigo} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {modoAtual !== 'pontos' && (
                          <p className="font-serif text-xl text-on-cream">{formatBRL(barbeiro.comissao)}</p>
                        )}
                        {modoAtual === 'pontos' && (
                          <p className="font-serif text-xl text-on-cream">{pts} pts</p>
                        )}
                        {modoAtual !== 'pontos' && (
                          <LancamentoForm
                            barbeiro={barbeiro}
                            metaInd={barbeiro.metaInd ?? undefined}
                            comissaoAtual={barbeiro.comissao}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </main>
      </div>
    </div>
  )
}
