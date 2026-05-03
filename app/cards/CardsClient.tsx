'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { nomeMes } from '@/lib/utils'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

const CardTemplate = dynamic(() => import('@/components/cards/CardTemplate'), { ssr: false })

interface MetaComIndividuais {
  id: string
  meta_coletiva: number
  premio_coletivo: string | null
  metas_individuais: MetaIndividual[]
}

interface Props {
  barbeiros: Barbeiro[]
  meta: MetaComIndividuais | null
  lancamentos: Lancamento[]
  totalEquipe: number
  mes: number
  ano: number
  tipo: 'inicio' | 'resultado'
}

export default function CardsClient({ barbeiros, meta, lancamentos, totalEquipe, mes, ano, tipo }: Props) {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const [baixando, setBaixando] = useState(false)
  const [tipoAtual, setTipoAtual] = useState<'inicio' | 'resultado'>(tipo)
  const [mesAtual, setMesAtual] = useState(mes)
  const [anoAtual, setAnoAtual] = useState(ano)

  function registrarCanvas(canvas: HTMLCanvasElement, nome: string, id: string) {
    canvasRefs.current.set(id, canvas)
  }

  async function baixarTodos() {
    setBaixando(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      canvasRefs.current.forEach((canvas, barbeiroId) => {
        const barbeiro = barbeiros.find(b => b.id === barbeiroId)
        if (!barbeiro) return
        const dataURL = canvas.toDataURL('image/png')
        const base64 = dataURL.split(',')[1]
        const nomeMesStr = nomeMes(mesAtual).replace(/\s/g, '_')
        zip.file(`${barbeiro.nome}_${nomeMesStr}_${anoAtual}_${tipoAtual}.png`, base64, { base64: true })
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cards_${nomeMes(mesAtual)}_${anoAtual}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBaixando(false)
    }
  }

  function baixarUm(barbeiroId: string, nome: string) {
    const canvas = canvasRefs.current.get(barbeiroId)
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${nome}_${nomeMes(mesAtual)}_${anoAtual}.png`
    a.click()
  }

  const meses = [1,2,3,4,5,6,7,8,9,10,11,12]
  const anos = [2024, 2025, 2026]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm font-sans">
              ← Dashboard
            </Link>
            <h1 className="font-serif text-2xl text-text">
              Cards <span className="metal-text-gold">PNG</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tipo */}
            <div className="flex gap-1">
              <button
                onClick={() => setTipoAtual('inicio')}
                className={`px-3 py-2 rounded-xl text-xs font-sans font-semibold transition-all
                  ${tipoAtual === 'inicio' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted'}`}
              >
                Início do mês
              </button>
              <button
                onClick={() => setTipoAtual('resultado')}
                className={`px-3 py-2 rounded-xl text-xs font-sans font-semibold transition-all
                  ${tipoAtual === 'resultado' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted'}`}
              >
                Resultado
              </button>
            </div>
            {/* Mês/Ano */}
            <select
              value={mesAtual}
              onChange={e => setMesAtual(parseInt(e.target.value))}
              className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary"
            >
              {meses.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
            <select
              value={anoAtual}
              onChange={e => setAnoAtual(parseInt(e.target.value))}
              className="bg-surface-2 border border-border text-text text-sm rounded-xl px-3 py-2 font-sans focus:outline-none focus:border-primary"
            >
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {/* Baixar tudo */}
            <button
              onClick={baixarTodos}
              disabled={baixando || barbeiros.length === 0}
              className="btn-primary text-sm py-2 px-4"
            >
              {baixando ? 'Gerando ZIP…' : `Baixar todos (${barbeiros.length})`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {barbeiros.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-text-muted font-sans">Nenhum barbeiro cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {barbeiros.map(barbeiro => {
              const metaInd = meta?.metas_individuais?.find(m => m.barbeiro_id === barbeiro.id) ?? null
              const lancamento = lancamentos.find(l => l.barbeiro_id === barbeiro.id) ?? null

              return (
                <div key={barbeiro.id} className="space-y-2">
                  <CardTemplate
                    tipo={tipoAtual}
                    barbeiro={barbeiro}
                    metaInd={metaInd}
                    lancamento={lancamento}
                    metaColetiva={meta?.meta_coletiva ?? 0}
                    premioColetivo={meta?.premio_coletivo ?? null}
                    totalEquipe={totalEquipe}
                    mes={mesAtual}
                    ano={anoAtual}
                    onCanvas={(canvas) => registrarCanvas(canvas, barbeiro.nome, barbeiro.id)}
                  />
                  <button
                    onClick={() => baixarUm(barbeiro.id, barbeiro.nome)}
                    className="w-full btn-ghost text-xs py-2 border border-border"
                  >
                    ↓ {barbeiro.nome}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
