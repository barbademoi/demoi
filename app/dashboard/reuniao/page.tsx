import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import { emailTemReuniao } from '@/lib/reuniao/preview'
import { gerarRaioXReuniao } from '@/lib/reuniao/raioX'
import { formatBRL } from '@/lib/utils'
import ReuniaoClient, { type NotaInicial } from './ReuniaoClient'

export const dynamic = 'force-dynamic'

function DeltaPill({ pct }: { pct: number | null }) {
  if (pct == null) {
    return <span className="text-text-muted text-xs font-sans">—</span>
  }
  const pos = pct >= 0
  return (
    <span className={`text-xs font-sans font-semibold tabular-nums ${pos ? 'text-green-500' : 'text-red-400'}`}>
      {pos ? '+' : ''}{Math.round(pct)}%
    </span>
  )
}

// MÓDULO DE REUNIÃO — PREVIEW/PLUS, restrito à conta do dono (allowlist).
// Só leitura dos dados da equipe; RLS por barbearia. Barbeiro nunca acessa.
export default async function ReuniaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // Trava REAL de acesso (não só esconder no menu).
  if (!emailTemReuniao(user.email ?? null)) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usuario } = await (supabase as any)
    .from('usuarios')
    .select('barbearia_id, barbearias(id, nome)')
    .eq('id', user.id)
    .single() as { data: { barbearia_id: string; barbearias: { id: string; nome: string } | null } | null }
  if (!usuario?.barbearias) redirect('/dashboard')
  const barbearia = usuario.barbearias

  const rx = await gerarRaioXReuniao(supabase, barbearia.id)

  // Anotações (graceful se a tabela ainda não existe — migration 037).
  let notas: NotaInicial[] = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notasRaw } = await (supabase as any)
      .from('reuniao_notas')
      .select('id, texto, feito, ordem')
      .eq('barbearia_id', barbearia.id)
      .order('feito', { ascending: true })
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })
    notas = (notasRaw ?? []) as NotaInicial[]
  } catch { /* tabela ausente → sem anotações até rodar a migration */ }

  return (
    <div className="min-h-screen flex">
      <Sidebar barbeariaNome={barbearia.nome} />
      <div className="flex-1 min-w-0 lg:pl-64 pt-14 lg:pt-0">
        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Cabeçalho */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl text-text">Reunião</h1>
              <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded border border-[#D4A85A]/40 text-[#D4A85A]/80">
                PREVIEW
              </span>
            </div>
            <p className="text-text-muted text-sm font-sans mt-0.5 leading-relaxed">
              Raio-x da equipe em <span className="capitalize">{rx.cicloLabel}</span> — dia {rx.diasDecorridos} de {rx.totalDiasCiclo}.
              Comparação vs. o <span className="font-semibold">mesmo período</span> de {rx.cicloAnteriorLabel} (mesmos dias decorridos).
            </p>
          </div>

          {/* Resumo do FATURAMENTO GERAL da casa — só quando o toggle está ligado */}
          {rx.mostrarFaturamentoGeral && rx.faturamentoGeral && rx.faturamentoGeral.some(m => m.valor > 0) && (
            <section className="card p-6">
              <h2 className="font-serif text-lg text-text mb-1">🏠 Faturamento geral da casa</h2>
              <p className="text-text-muted text-xs font-sans mb-4">
                Últimos 6 meses e a variação de um mês pro outro. O mês atual ainda está em andamento.
              </p>
              {(() => {
                const meses = rx.faturamentoGeral!
                const atual = meses[meses.length - 1]
                return (
                  <>
                    <div className="mb-4">
                      <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide mb-1">
                        <span className="capitalize">{atual.label}</span> {atual.emAndamento && '(em andamento)'}
                      </p>
                      <div className="flex items-baseline gap-3">
                        <p className="font-serif text-3xl text-text tabular-nums">{formatBRL(atual.valor)}</p>
                        <DeltaPill pct={atual.deltaPct} />
                        {atual.deltaPct != null && (
                          <span className="text-text-muted text-[11px] font-sans">vs. mês anterior</span>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm font-sans border-collapse">
                        <thead>
                          <tr className="text-text-muted text-xs uppercase tracking-wide">
                            <th className="text-left font-semibold py-2 pr-2">Mês</th>
                            <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Faturamento</th>
                            <th className="text-right font-semibold py-2 pl-2 whitespace-nowrap">Variação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meses.map((m, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="py-2 pr-2 text-text capitalize">
                                {m.label}{m.emAndamento && <span className="text-text-muted text-xs"> · parcial</span>}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums text-text">{formatBRL(m.valor)}</td>
                              <td className="py-2 pl-2 text-right"><DeltaPill pct={m.deltaPct} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              })()}
            </section>
          )}

          {rx.barbeiros.length === 0 ? (
            <div className="card p-6">
              <p className="text-text-muted text-sm font-sans">Ainda não há dados da equipe neste período.</p>
            </div>
          ) : (
            <>
              {/* Panorama da equipe */}
              <section className="card p-6">
                <h2 className="font-serif text-lg text-text mb-4">Panorama da equipe · {rx.baseLabel}</h2>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide mb-1">No período</p>
                    <p className="font-serif text-2xl text-text tabular-nums">{formatBRL(rx.totalAtual)}</p>
                    <p className="mt-0.5"><DeltaPill pct={rx.totalDeltaPct} /> <span className="text-text-muted text-[11px] font-sans">vs. mês passado</span></p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide mb-1">Mesmo período (mês passado)</p>
                    <p className="font-serif text-2xl text-text-muted tabular-nums">{formatBRL(rx.totalMesmoPeriodoAnterior)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide mb-1">Projeção de fechamento</p>
                    <p className="font-serif text-2xl text-primary tabular-nums">{formatBRL(rx.totalProjetado)}</p>
                  </div>
                </div>
              </section>

              {/* Precisam de atenção */}
              {rx.precisamAtencao.length > 0 && (
                <section className="card p-6 border border-amber-500/30">
                  <h2 className="font-serif text-lg text-text mb-1">⚠️ Precisam de atenção</h2>
                  <p className="text-text-muted text-xs font-sans mb-3">Abaixo do mesmo período do mês passado, ou atrás do ritmo pra bater a meta.</p>
                  <ul className="space-y-2">
                    {rx.precisamAtencao.map(l => (
                      <li key={l.barbeiroId} className="flex items-start justify-between gap-3 py-2 border-t border-border">
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-text text-sm">{l.nome}</p>
                          <p className="text-text-muted text-xs font-sans">{l.motivoAtencao}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-text text-sm font-sans tabular-nums">{formatBRL(l.valorAtual)}</p>
                          <DeltaPill pct={l.deltaPct} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Destaques */}
              {(rx.destaques.pontuacao || rx.destaques.faturamento || rx.destaques.evolucao) && (
                <section className="card p-6">
                  <h2 className="font-serif text-lg text-text mb-3">✨ Destaques</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {rx.destaques.faturamento && (
                      <div className="rounded-xl bg-surface-2 border border-border p-3">
                        <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">{rx.destaques.faturamentoLabel}</p>
                        <p className="font-sans font-semibold text-text text-sm mt-1">{rx.destaques.faturamento.nome}</p>
                        <p className="text-primary font-serif text-lg tabular-nums">{rx.destaques.faturamento.valorFmt}</p>
                      </div>
                    )}
                    {rx.destaques.pontuacao && (
                      <div className="rounded-xl bg-surface-2 border border-border p-3">
                        <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Mais pontos</p>
                        <p className="font-sans font-semibold text-text text-sm mt-1">{rx.destaques.pontuacao.nome}</p>
                        <p className="text-primary font-serif text-lg tabular-nums">{rx.destaques.pontuacao.valorFmt}</p>
                      </div>
                    )}
                    {rx.destaques.evolucao && (
                      <div className="rounded-xl bg-surface-2 border border-border p-3">
                        <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Maior evolução</p>
                        <p className="font-sans font-semibold text-text text-sm mt-1">{rx.destaques.evolucao.nome}</p>
                        <p className="text-green-500 font-serif text-lg tabular-nums">{rx.destaques.evolucao.valorFmt}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Detalhe por barbeiro */}
              <section className="card p-6">
                <h2 className="font-serif text-lg text-text mb-3">Por barbeiro</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans border-collapse">
                    <thead>
                      <tr className="text-text-muted text-xs uppercase tracking-wide">
                        <th className="text-left font-semibold py-2 pr-2">Barbeiro</th>
                        <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">{rx.baseLabel}</th>
                        <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">vs. mês passado</th>
                        <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Pontos</th>
                        <th className="text-right font-semibold py-2 pl-2 whitespace-nowrap">Projeção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.barbeiros.map(l => (
                        <tr key={l.barbeiroId} className="border-t border-border">
                          <td className="py-2 pr-2 text-text">
                            {l.nome}
                            {l.precisaAtencao && <span className="ml-1 text-amber-500" title={l.motivoAtencao ?? ''}>⚠️</span>}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-text">{formatBRL(l.valorAtual)}</td>
                          <td className="py-2 px-2 text-right"><DeltaPill pct={l.deltaPct} /></td>
                          <td className="py-2 px-2 text-right tabular-nums text-text-muted">{l.pontos}</td>
                          <td className="py-2 pl-2 text-right tabular-nums text-primary">{formatBRL(l.projetado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* Pauta por IA + Anotações (client) */}
          <ReuniaoClient
            temDados={rx.barbeiros.length > 0}
            notasIniciais={notas}
          />
        </main>
      </div>
    </div>
  )
}
