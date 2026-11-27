export default function Barra({ rotulo, pct, detalhe }: { rotulo: string; pct: number; detalhe?: string }) {
  const cor = pct >= 80 ? 'bg-ok' : pct >= 40 ? 'bg-latao' : 'bg-alerta'
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-semibold">{rotulo}</span>
        <span className="text-lg font-black">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={rotulo}>
        <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      {detalhe && <p className="mt-1 text-xs text-suave">{detalhe}</p>}
    </div>
  )
}
