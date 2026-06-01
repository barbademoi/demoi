import Link from 'next/link'
import { cicloDeData } from '@/lib/ciclo'

interface Props {
  mesSel: number
  anoSel: number
  mesAtual: number
  anoAtual: number
  diaFechamento: number
  podeVoltar: boolean
  podeAvancar: boolean
  hrefBase: string  // ex: '/dashboard' ou '/b/abc'
}

/**
 * Seletor ◀ Mês ▶ baseado em links (server component) — para Dashboard e
 * tela do barbeiro. Quando o período é o atual, fica destacado em azul;
 * passado em cinza; futuro em cinza claro.
 */
export default function MonthNavigator({
  mesSel, anoSel, mesAtual, anoAtual, diaFechamento,
  podeVoltar, podeAvancar, hrefBase,
}: Props) {
  const label = cicloDeData(new Date(anoSel, mesSel - 1, diaFechamento), diaFechamento).label
  const ehAtual = mesSel === mesAtual && anoSel === anoAtual
  const ehPassado = anoSel < anoAtual || (anoSel === anoAtual && mesSel < mesAtual)

  let pm = mesSel - 1, pa = anoSel
  if (pm < 1) { pm = 12; pa -= 1 }
  let nm = mesSel + 1, na = anoSel
  if (nm > 12) { nm = 1; na += 1 }

  const labelClass = ehAtual
    ? 'text-primary'
    : ehPassado
    ? 'text-text-muted'
    : 'text-text-muted/70'

  const subLabel =
    ehAtual ? 'mês atual'
    : ehPassado ? 'visualizando histórico'
    : 'mês futuro'

  const arrowBtn = 'p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-surface-2 border border-border">
      {podeVoltar ? (
        <Link
          href={`${hrefBase}?mes=${pm}&ano=${pa}`}
          aria-label="Mês anterior"
          className={arrowBtn}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      ) : (
        <span aria-disabled className={`${arrowBtn} opacity-30 cursor-not-allowed`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </span>
      )}

      <div className="text-center">
        <p className={`font-serif text-lg capitalize leading-tight font-semibold ${labelClass}`}>{label}</p>
        <p className="text-text-muted text-[11px] font-sans">{subLabel}</p>
      </div>

      {podeAvancar ? (
        <Link
          href={`${hrefBase}?mes=${nm}&ano=${na}`}
          aria-label="Próximo mês"
          className={arrowBtn}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ) : (
        <span aria-disabled className={`${arrowBtn} opacity-30 cursor-not-allowed`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      )}
    </div>
  )
}
