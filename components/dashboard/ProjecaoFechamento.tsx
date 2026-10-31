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

/**
 * O selo descreve o MÉTODO, não a qualidade dos dados do cliente.
 *
 * Antes ele dizia "confiança baixa" — que é o estado normal de quem não lança
 * comandas, ou seja, da maioria. Rotular o padrão como deficiência gera
 * discussão em vez de informação. "Estimativa simples" é igualmente honesto e
 * não acusa ninguém; quem quiser melhorar lê o convite abaixo do número.
 */
const METODO = {
  historico: { cor: 'text-green-400', fundo: 'border-green-500/30 bg-green-500/5', rotulo: 'pelo histórico' },
  tendencia: { cor: 'text-latao', fundo: 'border-latao/30 bg-latao/5', rotulo: 'ritmo e tendência' },
  ritmo: { cor: 'text-text', fundo: 'border-border bg-surface-2/40', rotulo: 'estimativa simples' },
} as const

export interface ProjecaoCasa {
  esperado: number
  /** true = não resta dia de trabalho; o número é o fechamento, não palpite. */
  cicloFechado: boolean
  diasRestantes: number
  faixa: { conservador: number; otimista: number } | null
  metodo: Projecao['metodo']
  descricaoMetodo: string
  alerta: string | null
  totalCicloAnterior: number
  baseDiferenteDosCards: boolean
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
  const tom = METODO[projecao.metodo]
  const anterior = projecao.totalCicloAnterior
  const diferenca = anterior > 0 ? projecao.esperado - anterior : null

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-sans text-xs uppercase tracking-wide text-text-muted">
          {projecao.cicloFechado ? 'Faturamento do ciclo' : 'Projeção de faturamento'} — {cicloLabel}
        </p>
        {/* Sem dia de trabalho restante não existe projeção: o valor é o
            fechamento. Manter a palavra "projeção" ali seria enganoso. */}
        <span className={`rounded-full border px-2.5 py-0.5 font-sans text-[11px] font-semibold ${tom.fundo} ${tom.cor}`}>
          {projecao.cicloFechado ? 'ciclo fechado' : tom.rotulo}
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
        <p className="mt-2 font-sans text-xs leading-snug text-text-muted">
          {projecao.descricaoMetodo}
        </p>
        {/* Aviso só quando há LACUNA no hábito desta barbearia. Quem nunca
            lançou comanda não recebe aviso nenhum — não é falha dela. */}
        {projecao.alerta && (
          <p className="mt-1 font-sans text-xs leading-snug text-amber-400">⚠ {projecao.alerta}</p>
        )}
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

      {/* Com base em comissão, o geral e os cards são grandezas diferentes.
          Dizer isso evita a conta que não fecha. */}
      {projecao.baseDiferenteDosCards && (
        <p className="font-sans text-[11px] leading-snug text-text-muted">
          Este é o <strong className="text-text">faturamento</strong> da barbearia. Os cards mostram a
          comissão de cada barbeiro — são valores diferentes e não somam entre si.
        </p>
      )}

      <p className="font-sans text-[11px] leading-snug text-text-muted">
        {projecao.cicloFechado ? (
          'Não há mais dia de trabalho neste ciclo — este é o valor final.'
        ) : (
          <>
            Projeção baseada nos lançamentos diários e no histórico. Não é garantia.
            {projecao.diasRestantes === 1
              ? ' Falta 1 dia de trabalho, hoje incluído.'
              : ` Faltam ${projecao.diasRestantes} dias de trabalho, hoje incluído.`}
            {projecao.metodo === 'ritmo' && ' Lançando o dia a dia, ela fica mais precisa a cada ciclo.'}
          </>
        )}
      </p>
    </div>
  )
}
