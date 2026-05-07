'use client'

import { useRef, useEffect } from 'react'
import { formatBRL, TIER_CONFIG, calcProgresso, calcTier, nomeMes } from '@/lib/utils'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

interface Props {
  barbeiros: Barbeiro[]
  meta: { id: string; meta_coletiva: number; premio_coletivo: string | null; metas_individuais: MetaIndividual[] } | null
  lancamentos: Lancamento[]
  faturamentoAcumulado: number
  barbeariaName: string
  mes: number
  ano: number
  onCanvas?: (canvas: HTMLCanvasElement) => void
}

const W = 1080
const H = 1920
const FONT_SERIF = '"DM Serif Display", Georgia, serif'
const FONT_SANS = '"DM Sans", system-ui, sans-serif'

const GRADIENTS = {
  bronze: ['#3D1A00', '#7B3F00', '#A0522D', '#7B3F00', '#3D1A00'],
  prata:  ['#6B7280', '#9CA3AF', '#D1D5DB', '#9CA3AF', '#6B7280'],
  ouro:   ['#92400E', '#D97706', '#FFD700', '#D97706', '#92400E'],
}

function makeMetalGrad(ctx: CanvasRenderingContext2D, tier: 'bronze' | 'prata' | 'ouro', x1: number, y1: number, x2: number, y2: number) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2)
  GRADIENTS[tier].forEach((c, i) => g.addColorStop(i / (GRADIENTS[tier].length - 1), c))
  return g
}

export default function RankingCard({ barbeiros, meta, lancamentos, faturamentoAcumulado, barbeariaName, mes, ano, onCanvas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = W
    canvas.height = H

    // Background
    ctx.fillStyle = '#08090D'
    ctx.fillRect(0, 0, W, H)

    // Grid texture
    ctx.strokeStyle = 'rgba(255,255,255,0.015)'
    ctx.lineWidth = 1
    for (let i = 0; i < W; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke() }
    for (let i = 0; i < H; i += 60) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke() }

    // Top gold line
    const topGrad = ctx.createLinearGradient(0, 0, W, 0)
    topGrad.addColorStop(0, 'transparent')
    topGrad.addColorStop(0.3, '#D97706')
    topGrad.addColorStop(0.5, '#FFD700')
    topGrad.addColorStop(0.7, '#D97706')
    topGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, 4)

    // Header
    ctx.font = `400 52px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText('Barber', 80, 110)
    const metaX = 80 + ctx.measureText('Barber').width
    const logoGrad = ctx.createLinearGradient(metaX, 60, metaX + 180, 110)
    logoGrad.addColorStop(0, '#D97706'); logoGrad.addColorStop(0.5, '#FFD700'); logoGrad.addColorStop(1, '#D97706')
    ctx.fillStyle = logoGrad
    ctx.fillText('Meta', metaX, 110)

    ctx.font = `400 26px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.fillText(barbeariaName, 80, 148)

    ctx.font = `600 22px ${FONT_SANS}`
    ctx.fillStyle = '#2563EB'
    ctx.textAlign = 'right'
    ctx.fillText(`${nomeMes(mes).toUpperCase()} ${ano}`, W - 80, 110)

    // Divider
    ctx.fillStyle = '#1E2028'
    ctx.fillRect(80, 178, W - 160, 2)

    // Title
    ctx.font = `400 72px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText('Ranking', 80, 280)
    ctx.font = `400 40px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.fillText('da equipe', 80, 330)

    // Build ranking
    const ranking = barbeiros
      .map(b => {
        const lnc = lancamentos.find(l => l.barbeiro_id === b.id)
        const metaInd = meta?.metas_individuais?.find(m => m.barbeiro_id === b.id)
        const comissao = lnc?.comissao_acumulada ?? 0
        const tier = metaInd
          ? calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm)
          : null
        return { ...b, comissao, tier }
      })
      .sort((a, b) => b.comissao - a.comissao)

    // Ranking rows
    const rowH = 140
    const rowStartY = 380

    ranking.forEach((b, i) => {
      const y = rowStartY + i * rowH
      if (y + rowH > H - 220) return // don't overflow

      // Row bg for top 3
      if (i < 3) {
        ctx.save()
        ctx.fillStyle = i === 0 ? 'rgba(255,215,0,0.04)' : i === 1 ? 'rgba(168,169,173,0.04)' : 'rgba(205,127,50,0.04)'
        ctx.beginPath()
        ctx.roundRect(60, y + 8, W - 120, rowH - 16, 16)
        ctx.fill()
        ctx.restore()
      }

      // Position number
      if (i < 3) {
        const tierName = i === 0 ? 'ouro' : i === 1 ? 'prata' : 'bronze'
        ctx.font = `700 48px ${FONT_SERIF}`
        ctx.fillStyle = makeMetalGrad(ctx, tierName as 'ouro' | 'prata' | 'bronze', 80, y, 80, y + 60)
      } else {
        ctx.font = `400 40px ${FONT_SERIF}`
        ctx.fillStyle = '#4B5263'
      }
      ctx.textAlign = 'left'
      ctx.fillText(`${i + 1}`, 80, y + 70)

      // Avatar circle
      const cx = 170, cy = y + 50, cr = 36
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, cr, 0, Math.PI * 2)
      ctx.fillStyle = '#161820'
      ctx.fill()
      ctx.strokeStyle = '#1E2028'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.clip()
      ctx.font = `400 28px ${FONT_SERIF}`
      ctx.fillStyle = '#8B8FA8'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.nome[0].toUpperCase(), cx, cy)
      ctx.restore()
      ctx.textBaseline = 'alphabetic'

      // Name
      ctx.font = `600 34px ${FONT_SANS}`
      ctx.fillStyle = '#EEF0F6'
      ctx.textAlign = 'left'
      const nomeDisplay = b.nome.length > 16 ? b.nome.slice(0, 15) + '…' : b.nome
      ctx.fillText(nomeDisplay, 220, y + 42)

      // Tier badge
      if (b.tier) {
        ctx.font = `700 22px ${FONT_SANS}`
        ctx.fillStyle = makeMetalGrad(ctx, b.tier, 220, y + 55, 220 + 140, y + 80)
        ctx.fillText(`★ ${TIER_CONFIG[b.tier].label.toUpperCase()}`, 220, y + 78)
      }

      // Commission
      ctx.font = `400 38px ${FONT_SERIF}`
      ctx.fillStyle = '#EEF0F6'
      ctx.textAlign = 'right'
      ctx.fillText(formatBRL(b.comissao), W - 80, y + 56)
    })

    // Meta coletiva section
    const colY = H - 200
    const totalEquipe = ranking.reduce((s, b) => s + b.comissao, 0)
    const faturamentoExibido = faturamentoAcumulado > 0 ? faturamentoAcumulado : totalEquipe
    const colPct = meta ? calcProgresso(faturamentoExibido, meta.meta_coletiva) : 0

    ctx.fillStyle = '#1E2028'
    ctx.fillRect(80, colY - 20, W - 160, 2)

    ctx.font = `400 34px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText('Meta Coletiva', 80, colY + 24)

    if (meta?.premio_coletivo) {
      ctx.font = `300 22px ${FONT_SANS}`
      ctx.fillStyle = '#8B8FA8'
      ctx.fillText(meta.premio_coletivo, 80, colY + 52)
    }

    ctx.font = `400 28px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.textAlign = 'right'
    ctx.fillText(`${formatBRL(faturamentoExibido)} de ${formatBRL(meta?.meta_coletiva ?? 0)}`, W - 80, colY + 24)

    // Bar
    const bY = colY + 68
    ctx.fillStyle = '#161820'
    ctx.beginPath(); ctx.roundRect(80, bY, W - 160, 24, 12); ctx.fill()

    if (colPct > 0) {
      const fillW = Math.round((W - 160) * colPct / 100)
      const barG = ctx.createLinearGradient(80, bY, 80 + fillW, bY + 24)
      GRADIENTS.ouro.forEach((c, i) => barG.addColorStop(i / (GRADIENTS.ouro.length - 1), c))
      ctx.fillStyle = barG
      ctx.beginPath(); ctx.roundRect(80, bY, fillW, 24, 12); ctx.fill()
    }

    ctx.font = `400 22px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.textAlign = 'right'
    ctx.fillText(`${colPct}% atingido`, W - 80, bY + 44)

    // Bottom line
    const botGrad = ctx.createLinearGradient(0, H - 4, W, H)
    botGrad.addColorStop(0, 'transparent')
    botGrad.addColorStop(0.5, '#2563EB')
    botGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, H - 4, W, 4)

    ctx.font = `300 22px ${FONT_SANS}`
    ctx.fillStyle = 'rgba(139,143,168,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('barbermeta.com.br', W / 2, H - 36)

    onCanvas?.(canvas)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiros.map(b => b.id).join(','), lancamentos.map(l => l.comissao_acumulada).join(','), mes, ano])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
    />
  )
}
