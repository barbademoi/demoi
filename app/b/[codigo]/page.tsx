import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import { gerarInsightsBarbeiro } from '@/lib/insights'
import BrandLogo from '@/components/BrandLogo'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

interface Props {
  params: { codigo: string }
}

type LancamentoComNome = Lancamento & {
  barbeiros: { nome: string } | null
}

export default async function BarbeiroPage({ params }: Props) {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeiroRaw } = await (supabase as any)
    .from('barbeiros')
    .select('*')
    .eq('link_codigo', params.codigo)
    .eq('ativo', true)
    .single()

  if (!barbeiroRaw) notFound()
  const barbeiro = barbeiroRaw as Barbeiro

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: barbeariaRaw } = await (supabase as any)
    .from('barbearias')
    .select('nome, cor_principal')
    .eq('id', barbeiro.barbearia_id)
    .single()

  const barbearia = barbeariaRaw as { nome: string; cor_principal: string } | null

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: metaRaw } = await (supabase as any)
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, faturamento_acumulado')
    .eq('barbearia_id', barbeiro.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const meta = metaRaw as { id: string; meta_coletiva: number; premio_coletivo: string | null; faturamento_acumulado: number } | null

  let metaInd: MetaIndividual | null = null
  if (meta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: miRaw } = await (supabase as any)
      .from('metas_individuais')
      .select('*')
      .eq('meta_id', meta.id)
      .eq('barbeiro_id', barbeiro.id)
      .single()
    metaInd = (miRaw as MetaIndividual | null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lancamentoRaw } = await (supabase as any)
    .from('lancamentos')
    .select('*')
    .eq('barbeiro_id', barbeiro.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const lancamento = lancamentoRaw as Lancamento | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rankingRaw } = await (supabase as any)
    .from('lancamentos')
    .select('barbeiro_id, comissao_acumulada, barbeiros(nome)')
    .eq('barbearia_id', barbeiro.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .order('comissao_acumulada', { ascending: false })

  const ranking = (rankingRaw ?? []) as unknown as LancamentoComNome[]

  const comissao = lancamento?.comissao_acumulada ?? 0
  const progresso = metaInd ? {
    bronze: calcProgresso(comissao, metaInd.bronze_comm),
    prata:  calcProgresso(comissao, metaInd.prata_comm),
    ouro:   calcProgresso(comissao, metaInd.ouro_comm),
    tier_atual: calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm),
  } : null

  const posicaoRanking = ranking.findIndex((l) => l.barbeiro_id === barbeiro.id) + 1
  const totalEquipe = ranking.reduce((s, l) => s + l.comissao_acumulada, 0)
  const faturamentoColetivo = (meta?.faturamento_acumulado ?? 0) > 0 ? meta!.faturamento_acumulado : totalEquipe
  const progressoColetivo = meta ? calcProgresso(faturamentoColetivo, meta.meta_coletiva) : 0

  const insights = gerarInsightsBarbeiro({
    comissao,
    metaInd,
    posicaoRanking: posicaoRanking || 99,
    totalBarbeiros: ranking.length,
    totalEquipe: faturamentoColetivo,
    metaColetiva: meta?.meta_coletiva ?? 0,
    barberoNome: barbeiro.nome,
  })

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-surface">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <BrandLogo size="md" />
          {barbearia && <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Card do barbeiro */}
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-3xl text-text-muted mx-auto mb-3 overflow-hidden">
            {barbeiro.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-full h-full object-cover" />
            ) : barbeiro.nome[0]}
          </div>
          <h2 className="font-serif text-3xl text-text">{barbeiro.nome}</h2>
          <p className="text-text-muted text-sm font-sans mt-1 capitalize">
            {nomeMes(mes)} {ano}
          </p>
          <div className="mt-6">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide mb-1">
              Comissão acumulada
            </p>
            <p className="font-serif text-5xl text-text">{formatBRL(comissao)}</p>
          </div>
          {progresso?.tier_atual && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border
              ${progresso.tier_atual === 'ouro'   ? 'border-yellow-500/30 bg-yellow-500/5' :
                progresso.tier_atual === 'prata'  ? 'border-gray-400/30 bg-gray-400/5' :
                'border-amber-700/30 bg-amber-700/5'}`}>
              <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[progresso.tier_atual].textClass}`}>
                ★ {TIER_CONFIG[progresso.tier_atual].label} atingido!
              </span>
            </div>
          )}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="card p-5 space-y-3">
            <p className="text-text-muted text-xs font-sans uppercase tracking-wide">Insights do mês</p>
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${ins.destaque ? 'bg-primary/10 border border-primary/20' : 'bg-surface-2'}`}>
                <span className="text-xl shrink-0">{ins.emoji}</span>
                <p className={`font-sans text-sm ${ins.destaque ? 'text-text font-medium' : 'text-text-muted'}`}>{ins.texto}</p>
              </div>
            ))}
          </div>
        )}

        {/* Barras Bronze / Prata / Ouro */}
        {metaInd && progresso && (
          <div className="card p-6 space-y-5">
            <h3 className="font-serif text-lg text-text">Suas metas</h3>
            {(['bronze', 'prata', 'ouro'] as const).map((tier) => {
              const metaVal = metaInd[`${tier}_comm` as 'bronze_comm' | 'prata_comm' | 'ouro_comm']
              const premio = metaInd[`${tier}_premio` as 'bronze_premio' | 'prata_premio' | 'ouro_premio']
              if (!metaVal || metaVal <= 0) return null
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                      {TIER_CONFIG[tier].label}
                      {premio && <span className="text-text-muted font-normal ml-2">· {premio}</span>}
                    </span>
                    <span className="text-text-muted text-xs font-sans">
                      {formatBRL(comissao)} / {formatBRL(metaVal)}
                    </span>
                  </div>
                  <div className="bar-track h-2.5">
                    <div
                      className={`${TIER_CONFIG[tier].barClass} h-full rounded-full transition-all duration-700`}
                      style={{ width: progresso[tier] > 0 ? `${progresso[tier]}%` : '3px' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-text-muted text-xs font-sans">{progresso[tier]}%</span>
                    {comissao < metaVal && (
                      <span className="text-text-muted text-xs font-sans">
                        faltam {formatBRL(metaVal - comissao)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Ranking da equipe */}
        {ranking.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-text">Ranking da equipe</h3>
              {posicaoRanking > 0 && (
                <span className="text-text-muted text-sm font-sans">
                  Você em <span className="text-text font-semibold">#{posicaoRanking}</span>
                </span>
              )}
            </div>
            <div className="space-y-2">
              {ranking.map((l, i) => {
                const isMe = l.barbeiro_id === barbeiro.id
                return (
                  <div
                    key={l.barbeiro_id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl
                      ${isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-2'}`}
                  >
                    <span className={`font-sans text-sm w-5 text-center
                      ${i === 0 ? 'metal-text-gold' : i === 1 ? 'metal-text-silver' : i === 2 ? 'metal-text-bronze' : 'text-text-muted'}`}>
                      {i + 1}
                    </span>
                    <span className={`font-sans text-sm flex-1 ${isMe ? 'text-text font-semibold' : 'text-text-muted'}`}>
                      {l.barbeiros?.nome ?? '—'} {isMe && '(você)'}
                    </span>
                    <span className={`font-sans text-sm ${isMe ? 'text-text' : 'text-text-muted'}`}>
                      {formatBRL(l.comissao_acumulada)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Meta coletiva */}
        {meta && (
          <div className="card p-6">
            <h3 className="font-serif text-lg text-text mb-1">Meta coletiva</h3>
            {meta.premio_coletivo && (
              <p className="text-text-muted text-sm font-sans mb-4">{meta.premio_coletivo}</p>
            )}
            <div className="bar-track h-3">
              <div
                className="bar-gold h-full rounded-full transition-all duration-700"
                style={{ width: progressoColetivo > 0 ? `${progressoColetivo}%` : '3px' }}
              />
            </div>
            <p className="text-text-muted text-xs font-sans mt-2 text-right">
              {formatBRL(faturamentoColetivo)} de {formatBRL(meta.meta_coletiva)}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
