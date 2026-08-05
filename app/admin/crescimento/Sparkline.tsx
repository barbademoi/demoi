import type { PontoSerie } from './actions'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Mini-gráfico de uma série só: a evolução do faturamento daquela barbearia.
 *
 * Uma série = sem legenda (o nome da linha na tabela já diz de quem é) e sem
 * grade, que só competiria com a linha nesse tamanho. O trecho do ciclo
 * CORRENTE vai tracejado e com o ponto vazado, porque é um valor em andamento
 * — desenhá-lo igual aos fechados sugeriria uma queda que não aconteceu.
 */
export default function Sparkline({
  serie: serieBruta,
  cor,
  largura = 132,
  altura = 34,
}: {
  serie: PontoSerie[]
  cor: string
  largura?: number
  altura?: number
}) {
  // Ciclo corrente ainda zerado (mal começou, ninguém lançou) não vira ponto:
  // desenhado, ele derruba a linha até o chão e sugere um colapso que não
  // houve. Fica de fora até ter valor.
  const serie = serieBruta.filter((p) => !(p.parcial && p.valor === 0))

  if (serie.length < 2) {
    return <div style={{ width: largura, height: altura }} aria-hidden />
  }

  const pad = 4
  const valores = serie.map((p) => p.valor)
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const span = max - min || 1

  const pontos = serie.map((p, i) => ({
    x: pad + (i * (largura - pad * 2)) / (serie.length - 1),
    // Escala local à própria série: aqui interessa a FORMA da evolução, não
    // comparar o valor absoluto de uma barbearia com o de outra.
    y: altura - pad - ((p.valor - min) / span) * (altura - pad * 2),
    parcial: p.parcial,
  }))

  const fechados = pontos.filter((p) => !p.parcial)
  const temParcial = pontos.some((p) => p.parcial)
  const linha = (ps: typeof pontos) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const ultimoFechado = fechados[fechados.length - 1]
  const ultimo = pontos[pontos.length - 1]

  const primeiro = serie[0]
  const derradeiro = serie[serie.length - 1]
  const resumo = `Faturamento de ${MESES[primeiro.mes - 1]}/${primeiro.ano} a ${MESES[derradeiro.mes - 1]}/${derradeiro.ano}`

  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={resumo}
      className="shrink-0 overflow-visible"
    >
      {/* Ciclos fechados: linha cheia. */}
      <polyline
        points={linha(fechados)}
        fill="none"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ciclo corrente: tracejado, sinalizando que ainda está correndo. */}
      {temParcial && ultimoFechado && (
        <polyline
          points={linha([ultimoFechado, ultimo])}
          fill="none"
          stroke={cor}
          strokeWidth={2}
          strokeDasharray="3 3"
          strokeLinecap="round"
          opacity={0.65}
        />
      )}
      {/* Último ponto: cheio quando fechado, vazado quando parcial. */}
      <circle
        cx={ultimo.x}
        cy={ultimo.y}
        r={3.5}
        fill={ultimo.parcial ? 'var(--bm-surface, #14161a)' : cor}
        stroke={cor}
        strokeWidth={2}
      />
    </svg>
  )
}
