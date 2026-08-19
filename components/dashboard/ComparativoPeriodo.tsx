'use client'

import { formatBRL } from '@/lib/utils'
import type { EscopoComparativo } from '@/lib/comparativoPeriodo'

/**
 * COMPARATIVO COM O MESMO PONTO DO CICLO ANTERIOR.
 *
 * Três leituras da mesma pergunta, da mais rápida pra mais detalhada:
 *   1. a frase — "está à frente/atrás por R$ X" (2 segundos de leitura);
 *   2. o ritmo — R$/dia de agora contra o R$/dia de então, mesma base de dias;
 *   3. o gráfico — a forma das duas curvas lado a lado.
 *
 * O gráfico é SVG na mão, sem biblioteca: são duas polilinhas e uma área. Uma
 * dependência de gráficos aqui custaria mais no bundle do dono do que o
 * desenho inteiro.
 *
 * Sem grade, sem eixo, sem rótulo de valor dentro do desenho: o número já está
 * na frase logo acima, e repetir enche a tela sem informar. O que a forma
 * mostra é o que só ela mostra — quando o mês acelerou ou parou.
 */

const LARGURA = 640
const ALTURA = 150
const PAD = 6

function coordenadas(serie: number[], max: number, totalDias: number): { x: number; y: number }[] {
  const largura = LARGURA - PAD * 2
  const altura = ALTURA - PAD * 2
  // O eixo X é sempre o ciclo inteiro decorrido, pra as duas curvas ficarem no
  // mesmo compasso: o dia 10 de um mês cai embaixo do dia 10 do outro.
  const passo = totalDias > 1 ? largura / (totalDias - 1) : 0
  return serie.map((v, i) => ({
    x: PAD + i * passo,
    y: PAD + altura - (max > 0 ? (v / max) * altura : 0),
  }))
}

function traco(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

function Grafico({
  escopo,
  labelAnterior,
  diasDecorridos,
}: {
  escopo: EscopoComparativo
  labelAnterior: string
  diasDecorridos: number
}) {
  const max = Math.max(...escopo.serieAtual, ...escopo.serieAnterior, 1)
  const dias = Math.max(escopo.serieAtual.length, escopo.serieAnterior.length, 2)

  const ptsAtual = coordenadas(escopo.serieAtual, max, dias)
  const ptsAnterior = coordenadas(escopo.serieAnterior, max, dias)
  const linhaAtual = traco(ptsAtual)
  const linhaAnterior = traco(ptsAnterior)
  const ultimoAtual = ptsAtual[ptsAtual.length - 1] ?? null
  // Área só embaixo da curva do mês atual — a do mês passado é referência, e
  // duas áreas empilhadas viram borrão.
  const area = ultimoAtual
    ? `${PAD},${ALTURA - PAD} ${linhaAtual} ${ultimoAtual.x.toFixed(1)},${ALTURA - PAD}`
    : ''

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Acumulado dia a dia: ${formatBRL(escopo.atual)} neste ciclo contra ${formatBRL(escopo.anterior)} no mesmo ponto de ${labelAnterior}.`}
        className="h-[130px] w-full sm:h-[150px]"
      >
        <defs>
          <linearGradient id="cmp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4B942" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#F4B942" stopOpacity="0" />
          </linearGradient>
        </defs>

        {area && <polygon points={area} fill="url(#cmp-area)" />}

        {/* Ciclo anterior: tom neutro e tracejado — é a régua, não o assunto. */}
        {linhaAnterior && (
          <polyline
            points={linhaAnterior}
            fill="none"
            stroke="#8B8FA8"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Ciclo atual: latão, cheio. */}
        {linhaAtual && (
          <polyline
            points={linhaAtual}
            fill="none"
            stroke="#F4B942"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Marca de hoje. É um traço vertical, não um círculo: o desenho estica
            na horizontal pra preencher a largura do card (preserveAspectRatio
            none), e um círculo viraria uma elipse achatada. A espessura de
            traço não estica. */}
        {ultimoAtual && (
          <line
            x1={ultimoAtual.x}
            y1={ultimoAtual.y - 5}
            x2={ultimoAtual.x}
            y2={ultimoAtual.y + 5}
            stroke="#F4B942"
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 font-sans text-xs text-text-muted">
          <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-latao" />
          Este ciclo
        </span>
        <span className="flex items-center gap-1.5 font-sans text-xs text-text-muted">
          <span
            aria-hidden="true"
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg,#8B8FA8 0 4px,transparent 4px 7px)' }}
          />
          {labelAnterior}
        </span>
      </div>

      {!escopo.medido && (
        // Uma reta apresentada como medição seria mentira. A tela diz o que é.
        <p className="text-center font-sans text-[11px] leading-snug text-text-muted">
          Linhas em ritmo médio {diasDecorridos === 1 ? 'do dia' : `dos ${diasDecorridos} dias`} —
          o traçado dia a dia aparece quando o faturamento entra por lançamento diário.
        </p>
      )}
    </div>
  )
}

export default function ComparativoPeriodo({
  escopo,
  labelAnterior,
  diasDecorridos,
  parcial,
  baseDecorridos,
  unidadeDia,
  ritmoAtual,
}: {
  escopo: EscopoComparativo
  labelAnterior: string
  diasDecorridos: number
  parcial: boolean
  /** Dias da base já decorridos — o mesmo divisor do "Ritmo atual" da tela. */
  baseDecorridos: number
  unidadeDia: string
  ritmoAtual: number
}) {
  // Barbearia nova (ou barbeiro que entrou agora): não há contra o que comparar.
  if (escopo.anterior <= 0) {
    return (
      <div className="card space-y-1 p-5">
        <p className="font-sans text-xs uppercase tracking-wide text-text-muted">
          Comparativo com {labelAnterior}
        </p>
        <p className="font-sans text-sm text-text-muted">
          Ainda não há {labelAnterior} pra comparar. No próximo ciclo esta seção
          mostra se você está à frente ou atrás do mesmo ponto do mês passado.
        </p>
      </div>
    )
  }

  const diferenca = escopo.atual - escopo.anterior
  const aFrente = diferenca > 0
  const empate = Math.abs(diferenca) < 0.005

  const corValor = empate ? 'text-text' : aFrente ? 'text-green-400' : 'text-amber-400'
  const corBloco = empate
    ? 'border-border bg-surface-2/40'
    : aFrente
      ? 'border-green-500/30 bg-green-500/5'
      : 'border-amber-500/30 bg-amber-500/5'

  // Mesmo divisor dos dois lados: o ritmo do mês passado é o que ele fazia por
  // dia ATÉ ESTE PONTO, não a média do mês fechado. Comparar com a média do mês
  // inteiro é o mesmo erro de comparar acumulado parcial com mês cheio.
  const ritmoAnterior = baseDecorridos > 0 ? escopo.anterior / baseDecorridos : 0

  return (
    <div className="card space-y-4 p-5">
      <p className="font-sans text-xs uppercase tracking-wide text-text-muted">
        Comparativo com {labelAnterior}
      </p>

      <div className={`rounded-2xl border p-4 ${corBloco}`}>
        <p className="font-sans text-sm leading-relaxed text-text">
          {parcial ? 'Até hoje você fez ' : 'No ciclo você fez '}
          <span className="font-semibold">{formatBRL(escopo.atual)}</span>. No mesmo
          ponto de {labelAnterior}, era{' '}
          <span className="font-semibold">{formatBRL(escopo.anterior)}</span> —{' '}
          {empate ? (
            <span className={corValor}>você está no mesmo patamar.</span>
          ) : (
            <>
              você está{' '}
              <span className={`font-semibold ${corValor}`}>
                {aFrente ? 'à frente' : 'atrás'} por {formatBRL(Math.abs(diferenca))}
              </span>
              .
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[130px] flex-1">
          <p className="font-sans text-xs text-text-muted">Ritmo atual</p>
          <p className={`font-serif text-2xl ${corValor}`}>{formatBRL(ritmoAtual)}</p>
          <p className="font-sans text-[11px] text-text-muted">por {unidadeDia}</p>
        </div>
        <div className="min-w-[130px] flex-1">
          <p className="font-sans text-xs text-text-muted">
            No mesmo ponto de {labelAnterior}
          </p>
          <p className="font-serif text-2xl text-text-muted">{formatBRL(ritmoAnterior)}</p>
          <p className="font-sans text-[11px] text-text-muted">por {unidadeDia}</p>
        </div>
      </div>

      {/* No primeiro dia do ciclo não há forma pra desenhar: seria um retângulo
          vazio com um ponto no canto. A frase e o ritmo já dizem tudo. */}
      {diasDecorridos > 1 && (
        <Grafico escopo={escopo} labelAnterior={labelAnterior} diasDecorridos={diasDecorridos} />
      )}
    </div>
  )
}
