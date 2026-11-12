/**
 * Termômetro do Tarefix: barra arredondada com degradê CONTÍNUO
 * vermelho #E5484D → amarelo #F5A524 → verde #2DB960 (sem faixas fixas),
 * marcador na posição exata do % e o número ao lado.
 * Vermelho/amarelo/verde são reservados a este componente.
 */

const PARADAS = [
  [0, [0xe5, 0x48, 0x4d]],
  [50, [0xf5, 0xa5, 0x24]],
  [100, [0x2d, 0xb9, 0x60]],
] as const

/** Cor exata do degradê num percentual (para o número e o marcador). */
export function corDoPercentual(p: number): string {
  const v = Math.max(0, Math.min(100, p))
  const i = v <= 50 ? 0 : 1
  const [p0, c0] = PARADAS[i]
  const [p1, c1] = PARADAS[i + 1]
  const t = (v - p0) / (p1 - p0)
  const c = c0.map((x, k) => Math.round(x + (c1[k] - x) * t))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
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
  const cor = vazio ? undefined : corDoPercentual(p)
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-bold text-tf-suave">{rotulo}</span>
        {detalhe && <span className="text-sm text-tf-suave">{detalhe}</span>}
      </div>
      <div className="flex items-center gap-3">
        <div
          className={`relative flex-1 rounded-full ${grande ? 'h-5' : 'h-3.5'}`}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={vazio ? undefined : p}
          aria-label={rotulo}
          style={{ background: 'linear-gradient(90deg, #E5484D 0%, #F5A524 50%, #2DB960 100%)' }}
        >
          {/* parte ainda não alcançada fica velada, o degradê continua visível */}
          <div
            className="absolute inset-y-0 right-0 rounded-r-full bg-tf-card/70"
            style={{ left: `${p}%`, borderTopLeftRadius: p === 0 ? 9999 : 0, borderBottomLeftRadius: p === 0 ? 9999 : 0 }}
          />
          {!vazio && (
            <div
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-tf-card shadow ${grande ? 'h-8 w-8' : 'h-6 w-6'}`}
              style={{ left: `${p}%`, background: cor }}
            />
          )}
        </div>
        {/* número na cor do texto: amarelo sobre fundo claro não teria leitura */}
        <span className={`w-16 shrink-0 text-right font-extrabold tabular-nums ${grande ? 'text-3xl' : 'text-xl'}`}>
          {vazio ? '—' : `${p}%`}
        </span>
      </div>
    </div>
  )
}
