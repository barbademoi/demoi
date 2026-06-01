'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { nomeMes } from '@/lib/utils'
import BrandLogo from '@/components/BrandLogo'
import MonthNavigator from '@/components/dashboard/MonthNavigator'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

const CardTemplate = dynamic(() => import('@/components/cards/CardTemplate'), { ssr: false })
const RankingCard = dynamic(() => import('@/components/cards/RankingCard'), { ssr: false })

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
  faturamentoAcumulado: number
  barbeariaName: string
  mes: number
  ano: number
  mesCorrente: number
  anoCorrente: number
  ehPeriodoPassado: boolean
  podeVoltar: boolean
  podeAvancar: boolean
  tipo: 'inicio' | 'resultado'
  deltaMap: Record<string, number | null>
  cicloLabel: string
  diaFechamento: number
}

export default function CardsClient({ barbeiros, meta, lancamentos, totalEquipe, faturamentoAcumulado, barbeariaName, mes, ano, mesCorrente, anoCorrente, ehPeriodoPassado, podeVoltar, podeAvancar, tipo, deltaMap, cicloLabel, diaFechamento }: Props) {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map())
  const rankingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [baixando, setBaixando] = useState(false)
  const [tipoAtual, setTipoAtual] = useState<'inicio' | 'resultado'>(tipo)
  const [mesAtual, setMesAtual] = useState(mes)
  const [anoAtual, setAnoAtual] = useState(ano)

  function registrarCanvas(canvas: HTMLCanvasElement, id: string) {
    canvasRefs.current.set(id, canvas)
  }

  async function baixarTodos() {
    setBaixando(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Individual cards
      canvasRefs.current.forEach((canvas, barbeiroId) => {
        const barbeiro = barbeiros.find(b => b.id === barbeiroId)
        if (!barbeiro) return
        const dataURL = canvas.toDataURL('image/png')
        const base64 = dataURL.split(',')[1]
        zip.file(`${barbeiro.nome}_${nomeMes(mesAtual)}_${anoAtual}.png`, base64, { base64: true })
      })

      // Ranking card
      if (rankingCanvasRef.current) {
        const base64 = rankingCanvasRef.current.toDataURL('image/png').split(',')[1]
        zip.file(`ranking_${nomeMes(mesAtual)}_${anoAtual}.png`, base64, { base64: true })
      }

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

  function baixarRanking() {
    const canvas = rankingCanvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `ranking_${nomeMes(mesAtual)}_${anoAtual}.png`
    a.click()
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm font-sans">
              ← Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <BrandLogo size="md" />
              <span className="text-text-muted text-sm font-sans">/ Cards PNG</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <button
              onClick={baixarTodos}
              disabled={baixando || barbeiros.length === 0}
              className="btn-primary text-sm py-2 px-4"
            >
              {baixando ? 'Gerando ZIP…' : `↓ Baixar todos (${barbeiros.length + 1})`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <MonthNavigator
            mesSel={mes}
            anoSel={ano}
            mesAtual={mesCorrente}
            anoAtual={anoCorrente}
            diaFechamento={diaFechamento}
            podeVoltar={podeVoltar}
            podeAvancar={podeAvancar}
            hrefBase="/cards"
            extra={{ tipo: tipoAtual }}
          />
          {ehPeriodoPassado && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-200 text-xs font-sans leading-relaxed">
                🕒 Gerando cards de <span className="font-semibold capitalize">{cicloLabel}</span>.
              </p>
              <Link
                href="/cards"
                className="text-amber-200 hover:text-amber-100 text-xs font-sans underline whitespace-nowrap shrink-0"
              >
                Voltar ao atual
              </Link>
            </div>
          )}
        </div>


        {/* Card Ranking da Barbearia */}
        <div>
          <h2 className="font-serif text-xl text-text mb-4">
            Card da Barbearia <span className="text-text-muted text-sm font-sans">— Ranking completo</span>
          </h2>
          <div className="max-w-xs space-y-2">
            <RankingCard
              barbeiros={barbeiros}
              meta={meta}
              lancamentos={lancamentos}
              faturamentoAcumulado={faturamentoAcumulado}
              barbeariaName={barbeariaName}
              mes={mesAtual}
              ano={anoAtual}
              cicloLabel={mesAtual === mes && anoAtual === ano ? cicloLabel : undefined}
              onCanvas={(canvas) => { rankingCanvasRef.current = canvas }}
            />
            <button
              onClick={baixarRanking}
              className="w-full btn-ghost text-xs py-2 border border-border"
            >
              ↓ Ranking {barbeariaName}
            </button>
          </div>
        </div>

        {/* Cards individuais */}
        <div>
          <h2 className="font-serif text-xl text-text mb-4">
            Cards individuais <span className="text-text-muted text-sm font-sans">— {barbeiros.length} barbeiros</span>
          </h2>
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
                      faturamentoAcumulado={faturamentoAcumulado}
                      mes={mesAtual}
                      ano={anoAtual}
                      cicloLabel={mesAtual === mes && anoAtual === ano ? cicloLabel : undefined}
                      delta={deltaMap[barbeiro.id] ?? null}
                      onCanvas={(canvas) => registrarCanvas(canvas, barbeiro.id)}
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
        </div>

      </main>
    </div>
  )
}
