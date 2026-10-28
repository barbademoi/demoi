'use client'

import { formatBRL } from '@/lib/utils'
import type { Projecao } from '@/lib/projecao'

/**
 * PROJEÇÃO DE FECHAMENTO — bloco da barbearia.
 *
 * O número grande é um palpite informado, e a tela diz isso sem rodeios: a
 * faixa fica ao lado dele (não escondida), a confiança vem com o MOTIVO, e a
 * frase de rodapé encerra qualquer dúvida sobre o que é.
 *
 * Projeção apresentada como número exato é a forma mais fácil de o dono tomar
 * uma decisão de dinheiro em cima de uma conta que pode errar 5%.
 */

const TOM = {
  alta: { cor: 'text-green-400', fundo: 'border-green-500/30 bg-green-500/5', rotulo: 'confiança alta' },
  media: { cor: 'text-latao', fundo: 'border-latao/30 bg-latao/5', rotulo: 'confiança média' },
  baixa: { cor: 'text-amber-400', fundo: 'border-amber-500/30 bg-amber-500/5', rotulo: 'confiança baixa' },
} as const

export interface ProjecaoCasa {
  esperado: number
  faixa: { conservador: number; otimista: number } | null
  confianca: Projecao['confianca']
  motivos: string[]
  totalCicloAnterior: number
}

export default function ProjecaoFechamento({
  projecao,
  cicloLabel,
  labelAnterior,
}: {
  projecao: ProjecaoCasa
  cicloLabel: string
  labelAnterior: string
}) {
  const tom = TOM[projecao.confianca]
  const anterior = projecao.totalCicloAnterior
  const diferenca = anterior > 0 ? projecao.esperado - anterior : null

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-sans text-xs uppercase tracking-wide text-text-muted">
          Projeção de fechamento — {cicloLabel}
        </p>
        <span className={`rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-semibold ${tom.fundo} ${tom.cor}`}>
          {tom.rotulo}
        </span>
      </div>

      <div className={`rounded-2xl border p-4 ${tom.fundo}`}>
        <p className={`font-serif text-3xl leading-none ${tom.cor}`}>{formatBRL(projecao.esperado)}</p>
        {projecao.faixa && (
          <p className="mt-2 font-sans text-sm text-text-muted">
            entre <span className="font-semibold text-text">{formatBRL(projecao.faixa.conservador)}</span> e{' '}
            <span className="font-semibold text-text">{formatBRL(projecao.faixa.otimista)}</span>
          </p>
        )}
        {/* O motivo da confiança vale mais que o rótulo: "média" não diz o que
            fazer, "3 dias sem lançamento" diz. */}
        <p className="mt-2 font-sans text-xs leading-snug text-text-muted">
          {projecao.motivos.join(' · ')}
        </p>
      </div>

      {diferenca !== null && (
        <p className="font-sans text-sm text-text">
          {labelAnterior} fechou em{' '}
          <span className="font-semibold">{formatBRL(anterior)}</span> —{' '}
          {Math.abs(diferenca) < 0.005 ? (
            <span className="text-text-muted">a projeção está no mesmo patamar.</span>
          ) : (
            <span className={diferenca > 0 ? 'font-semibold text-green-400' : 'font-semibold text-amber-400'}>
              {diferenca > 0 ? '+' : '−'}{formatBRL(Math.abs(diferenca))} {diferenca > 0 ? 'acima' : 'abaixo'}
            </span>
          )}
        </p>
      )}

      <p className="font-sans text-[11px] leading-snug text-text-muted">
        Projeção baseada nos lançamentos diários e no histórico. Não é garantia.
      </p>
    </div>
  )
}
