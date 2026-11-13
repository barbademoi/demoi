/**
 * Termômetro do Tarefix — visual "instrumento": metal escuro e pesado.
 *
 * Degradê CONTÍNUO rubi → ouro velho → esmeralda (sem faixas fixas). A barra
 * fica dentro de uma moldura de aço grafite; a parte alcançada tem reflexo
 * cromado em faixas (luz em cima, sombra no meio, contraluz embaixo) e um
 * brilho que passa devagar; a parte que falta é um trilho escuro com a cor só
 * insinuada. Marcas em 25/50/75, marcador de aço com centro na cor do %.
 * Rubi/ouro/esmeralda são reservados a este componente (e ao calendário do mês).
 */

export const CORES_TERMOMETRO = { vermelho: '#A3121F', amarelo: '#B8780C', verde: '#0E7A3B' } as const

const PARADAS = [
  [0, [0xa3, 0x12, 0x1f]],
  [50, [0xb8, 0x78, 0x0c]],
  [100, [0x0e, 0x7a, 0x3b]],
] as const

const DEGRADE = `linear-gradient(90deg, ${CORES_TERMOMETRO.vermelho} 0%, ${CORES_TERMOMETRO.amarelo} 50%, ${CORES_TERMOMETRO.verde} 100%)`
/** Reflexo cromado em faixas: luz forte em cima, sombra no meio, contraluz e borda escura embaixo. */
const BRILHO =
  'linear-gradient(180deg, rgba(255,255,255,.58) 0%, rgba(255,255,255,.2) 20%, rgba(255,255,255,0) 34%, rgba(0,0,0,.22) 52%, rgba(0,0,0,.08) 70%, rgba(255,255,255,.16) 84%, rgba(0,0,0,.5) 100%)'

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

/** Centro do marcador: a cor do % com luz metálica. */
function knob(p: number): string {
  const [r, g, b] = rgb(p)
  const escuro = `rgb(${Math.round(r * 0.45)} ${Math.round(g * 0.45)} ${Math.round(b * 0.45)})`
  return `radial-gradient(circle at 35% 28%, rgba(255,255,255,.9) 0%, rgba(255,255,255,.35) 18%, rgb(${r} ${g} ${b}) 50%, ${escuro} 100%)`
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
  const altura = grande ? 'h-7' : 'h-5'
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-extrabold uppercase tracking-wide text-tf-suave">{rotulo}</span>
        {detalhe && <span className="text-sm text-tf-suave">{detalhe}</span>}
      </div>
      <div className={`flex items-center ${grande ? 'gap-6' : 'gap-5'}`}>
        {/* moldura de aço grafite */}
        <div className="tf-termo-moldura flex-1 rounded-full p-[3px]">
          <div className={`relative ${altura}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={vazio ? undefined : p} aria-label={rotulo}>
            {/* trilho escuro com a cor só insinuada */}
            <div className="tf-termo-trilho absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 opacity-[.22]" style={{ background: DEGRADE }} />
            </div>
            {/* parte alcançada: cores profundas + cromado */}
            {p > 0 && (
              <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full" style={{ width: `${p}%` }}>
                <div className="absolute inset-y-0 left-0" style={{ width: `${(100 / p) * 100}%`, background: DEGRADE }} />
                <div className="absolute inset-0" style={{ background: BRILHO }} />
                <div className="tf-termo-reflexo absolute inset-0" />
              </div>
            )}
            {/* marcas de 25 / 50 / 75 */}
            {[25, 50, 75].map((m) => (
              <span key={m} className="tf-termo-marca absolute inset-y-[18%] w-px" style={{ left: `${m}%` }} aria-hidden />
            ))}
            {!vazio && (
              <div
                className={`tf-termo-knob absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${grande ? 'h-11 w-11 p-[5px]' : 'h-8 w-8 p-1'}`}
                style={{ left: `${p}%` }}
              >
                <div className="h-full w-full rounded-full" style={{ background: knob(p), boxShadow: 'inset 0 -2px 3px rgba(0,0,0,.45), inset 0 1px 1px rgba(255,255,255,.35)' }} />
              </div>
            )}
          </div>
        </div>
        {/* número na cor do texto: legível em claro e escuro */}
        <span className={`w-[4.75rem] shrink-0 text-right font-black tabular-nums tracking-tight ${grande ? 'text-4xl' : 'text-2xl'}`}>{vazio ? '—' : `${p}%`}</span>
      </div>
    </div>
  )
}
