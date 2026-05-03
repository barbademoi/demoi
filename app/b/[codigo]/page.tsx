import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatBRL, nomeMes, TIER_CONFIG, calcProgresso, calcTier } from '@/lib/utils'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

interface Props {
  params: { codigo: string }
}

type BarbeiroComBarbearia = Barbeiro & {
  barbearias: { nome: string; cor_principal: string }
}

type MetaComIndividuais = {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  metas_individuais: MetaIndividual[]
}

type LancamentoComNome = Lancamento & {
  barbeiros: { nome: string }
}

export default async function BarbeiroPage({ params }: Props) {
  const supabase = createClient()

  const { data: barbeiroRaw } = await supabase
    .from('barbeiros')
    .select('*, barbearias(nome, cor_principal)')
    .eq('link_codigo', params.codigo)
    .eq('ativo', true)
    .single()

  if (!barbeiroRaw) notFound()
  const barbeiro = barbeiroRaw as unknown as BarbeiroComBarbearia
  const barbearia = barbeiro.barbearias

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  const { data: metaRaw } = await supabase
    .from('metas')
    .select('id, meta_coletiva, premio_coletivo, metas_individuais!inner(*)')
    .eq('barbearia_id', barbeiro.barbearia_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .eq('metas_individuais.barbeiro_id', barbeiro.id)
    .single()

  const meta = metaRaw as unknown as MetaComIndividuais | null
  const metaInd = meta?.metas_individuais?.[0] ?? null

  const { data: lancamentoRaw } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('barbeiro_id', barbeiro.id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  const lancamento = lancamentoRaw as Lancamento | null

  const { data: rankingRaw } = await supabase
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
  const progressoColetivo = meta ? calcProgresso(totalEquipe, meta.meta_coletiva) : 0

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-border bg-surface">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <h1 className="font-serif text-2xl text-text">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-xs font-sans">{barbearia.nome}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in">

        {/* Card do barbeiro */}
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-3xl text-text-muted mx-auto mb-3">
            {barbeiro.nome[0]}
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
              ${progresso.tier_atual === 'ouro'   ? 'border-gold/30 bg-gold/5' :
                progresso.tier_atual === 'prata'  ? 'border-silver/30 bg-silver/5' :
                'border-bronze/30 bg-bronze/5'}`}>
              <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[progresso.tier_atual].textClass}`}>
                ★ {TIER_CONFIG[progresso.tier_atual].label} atingido!
              </span>
            </div>
          )}
        </div>

        {/* Barras Bronze / Prata / Ouro */}
        {metaInd && progresso && (
          <div className="card p-6 space-y-5">
            <h3 className="font-serif text-lg text-text">Suas metas</h3>
            {(['bronze', 'prata', 'ouro'] as const).map((tier) => (
              <div key={tier}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-sans font-semibold ${TIER_CONFIG[tier].textClass}`}>
                    {TIER_CONFIG[tier].label}
                  </span>
                  <span className="text-text-muted text-xs font-sans">
                    {formatBRL(comissao)} / {formatBRL(metaInd[`${tier}_comm`])}
                  </span>
                </div>
                <div className="bar-track h-4">
                  <div
                    className={`${TIER_CONFIG[tier].barClass} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${progresso[tier]}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-text-muted text-xs font-sans">{progresso[tier]}%</span>
                  {comissao < metaInd[`${tier}_comm`] && (
                    <span className="text-text-muted text-xs font-sans">
                      faltam {formatBRL(metaInd[`${tier}_comm`] - comissao)}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
            <p className="text-text-muted text-sm font-sans mb-4">{meta.premio_coletivo}</p>
            <div className="bar-track h-3">
              <div
                className="bar-gold h-full rounded-full transition-all duration-700"
                style={{ width: `${progressoColetivo}%` }}
              />
            </div>
            <p className="text-text-muted text-xs font-sans mt-2 text-right">
              {formatBRL(totalEquipe)} de {formatBRL(meta.meta_coletiva)}
            </p>
          </div>
        )}

      </main>
    </div>
  )
}
