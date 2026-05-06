'use client'

interface Props {
  mes: number
  ano: number
}

export default function MesSelector({ mes, ano }: Props) {
  const meses = [1,2,3,4,5,6,7,8,9,10,11,12]
  const anos = [2024, 2025, 2026]

  function navegar(novoMes: number, novoAno: number) {
    const url = new URL(window.location.href)
    url.searchParams.set('mes', String(novoMes))
    url.searchParams.set('ano', String(novoAno))
    window.location.href = url.toString()
  }

  return (
    <div className="flex gap-1">
      <select
        defaultValue={mes}
        onChange={e => navegar(parseInt(e.target.value), ano)}
        className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary cursor-pointer"
      >
        {meses.map(m => (
          <option key={m} value={m}>{String(m).padStart(2,'0')}</option>
        ))}
      </select>
      <select
        defaultValue={ano}
        onChange={e => navegar(mes, parseInt(e.target.value))}
        className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary cursor-pointer"
      >
        {anos.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}
