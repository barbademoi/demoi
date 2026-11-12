'use client'

import { useState } from 'react'
import { anoMesDe, datasDoMes, diaDaSemana, mesAnterior, mesPorExtenso, NOMES_DIAS_CURTOS } from '@/lib/tarefix/datas'
import { Erro, useAcao } from '@/components/tarefix/ui'
import { alternarFolga } from '../acoes'

function proximoMes(anoMes: string) {
  const [a, m] = anoMes.split('-').map(Number)
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
}

export function CalendarioFolgas({ colaboradorId, folgas, hoje }: { colaboradorId: string; folgas: string[]; hoje: string }) {
  const [mes, setMes] = useState(anoMesDe(hoje))
  const [marcadas, setMarcadas] = useState(() => new Set(folgas))
  const [mexendo, setMexendo] = useState<string | null>(null)
  const { erro, rodar } = useAcao()

  const datas = datasDoMes(mes)
  const vazios = diaDaSemana(datas[0])

  function alternar(data: string) {
    const marcar = !marcadas.has(data)
    const antes = new Set(marcadas)
    const depois = new Set(marcadas)
    if (marcar) depois.add(data)
    else depois.delete(data)
    setMarcadas(depois) // otimista
    setMexendo(data)
    rodar(
      async () => {
        const r = await alternarFolga(colaboradorId, data, marcar)
        if (!r.ok) setMarcadas(antes)
        setMexendo(null)
        return r
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-tf-marca-clara" onClick={() => setMes(mesAnterior(mes))} aria-label="Mês anterior">
          ‹
        </button>
        <span className="font-extrabold first-letter:uppercase">{mesPorExtenso(mes)}</span>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-xl hover:bg-tf-marca-clara" onClick={() => setMes(proximoMes(mes))} aria-label="Próximo mês">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-tf-suave">
        {NOMES_DIAS_CURTOS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: vazios }).map((_, i) => (
          <span key={`v${i}`} />
        ))}
        {datas.map((d) => {
          const folga = marcadas.has(d)
          return (
            <button
              key={d}
              type="button"
              onClick={() => alternar(d)}
              disabled={mexendo === d}
              aria-pressed={folga}
              aria-label={`${d}${folga ? ' (folga)' : ''}`}
              className={`flex aspect-square min-h-[44px] items-center justify-center rounded-xl text-sm font-bold transition ${
                folga ? 'bg-tf-marca text-white' : 'bg-tf-fundo hover:bg-tf-marca-clara'
              } ${d === hoje ? 'ring-2 ring-tf-marca ring-offset-1 ring-offset-tf-card' : ''}`}
            >
              {Number(d.slice(8))}
            </button>
          )
        })}
      </div>
      <Erro texto={erro} />
    </div>
  )
}
