/**
 * Termômetro do Tarefix — acabamento metálico.
 *
 * Degradê CONTÍNUO vermelho → âmbar → verde (sem faixas fixas). A parte
 * alcançada mostra as cores fortes com brilho metálico (reflexo em cima,
 * sombra embaixo e um brilho que passa devagar); a parte que falta vira um
 * trilho de metal escovado com a cor só insinuada. Marcador na posição exata
 * do %, e o número ao lado.
 * Vermelho/âmbar/verde são reservados a este componente (e ao calendário do mês).
 */

export const CORES_TERMOMETRO = { vermelho: '#E11D2E', amarelo: '#F59E0B', verde: '#16A34A' } as const

const PARADAS = [
  [0, [0xe1, 0x1d, 0x2e]],
  [50, [0xf5, 0x9e, 0x0b]],
  [100, [0x16, 0xa3, 0x4a]],
] as const

const DEGRADE = `linear-gradient(90deg, ${CORES_TERMOMETRO.vermelho} 0%, ${CORES_TERMOMETRO.amarelo} 50%, ${CORES_TERMOMETRO.verde} 100%)`
/** Reflexo metálico: luz em cima, sombra embaixo. */
const BRILHO = 'linear-gradient(180deg, rgba(255,255,255,.62) 0%, rgba(255,255,255,.18) 38%, rgba(255,255,255,0) 52%, rgba(0,0,0,.10) 70%, rgba(0,0,0,.30) 100%)'

function rgb(p: number): [number, number, number] {
  const v = Math.max(0, Math.min(100, p))
  const i = v <= 50 ? 0 : 1
  const [p0, c0] = PARADAS[i]
  const [p1, c1] = PARADAS[i + 1]
  const t = (v - p0) / (p1 - p0)
  return c0.map((x, k) => Math.round(x + (c1[k] - x) * t)) as [number, number, number]
}

/** Cor exata do degradê num percentual. */
export function corDoPercentual(p: number): string {
  const [r, g, b] = rgb(p)
  return `rgb(${r} ${g} ${b})`
}

/** Fundo metálico de uma cor do termômetro (usado também no calendário do mês). */
export function fundoMetalico(p: number): string {
  return `${BRILHO}, linear-gradient(${corDoPercentual(p)}, ${corDoPercentual(p)})`
}

/** Botão metálico do marcador. */
function knob(p: number): string {
  const [r, g, b] = rgb(p)
  const escuro = `rgb(${Math.round(r * 0.62)} ${Math.round(g * 0.62)} ${Math.round(b * 0.62)})`
  return `radial-gradient(circle at 34% 28%, #ffffff 0%, rgba(255,255,255,.85) 14%, rgb(${r} ${g} ${b}) 48%, ${escuro} 100%)`
}

export function Termometro({
  percentual,
  rotulo,
  detalhe,
  grande = false,
}: {
  percentual: number | null
  rotulo: string
  detalhe?: string
  grande?: boolean
}) {
  const vazio = percentual === null
  const p = vazio ? 0 : Math.max(0, Math.min(100, percentual))
  const altura = grande ? 'h-5' : 'h-3.5'
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-bold text-tf-suave">{rotulo}</span>
        {detalhe && <span className="text-sm text-tf-suave">{detalhe}</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className={`relative flex-1 ${altura}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={vazio ? undefined : p} aria-label={rotulo}>
          {/* trilho: metal escovado com a cor só insinuada */}
          <div className="tf-termo-trilho absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 opacity-25" style={{ background: DEGRADE }} />
          </div>
          {/* parte alcançada: cores fortes + brilho metálico */}
          {p > 0 && (
            <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full" style={{ width: `${p}%` }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${(100 / p) * 100}%`, background: DEGRADE }} />
              <div className="absolute inset-0" style={{ background: BRILHO }} />
              <div className="tf-termo-reflexo absolute inset-0" />
            </div>
          )}
          {!vazio && (
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 ${grande ? 'h-8 w-8' : 'h-6 w-6'}`}
              style={{ left: `${p}%`, background: knob(p), boxShadow: '0 2px 6px rgba(0,0,0,.35), inset 0 -2px 3px rgba(0,0,0,.25)' }}
            />
          )}
        </div>
        {/* número na cor do texto: âmbar sobre fundo claro não teria leitura */}
        <span className={`w-16 shrink-0 text-right font-extrabold tabular-nums ${grande ? 'text-3xl' : 'text-xl'}`}>{vazio ? '—' : `${p}%`}</span>
      </div>
    </div>
  )
}
