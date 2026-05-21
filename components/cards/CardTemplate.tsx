'use client'

import { useRef, useEffect } from 'react'
import { formatBRL, TIER_CONFIG, calcProgresso, calcTier, nomeMes } from '@/lib/utils'
import { gerarInsightsBarbeiro } from '@/lib/insights'
import type { Barbeiro, MetaIndividual, Lancamento } from '@/types/database'

interface Props {
  tipo: 'inicio' | 'resultado'
  barbeiro: Barbeiro
  metaInd: MetaIndividual | null
  lancamento: Lancamento | null
  metaColetiva: number
  premioColetivo: string | null
  totalEquipe: number
  faturamentoAcumulado: number
  mes: number
  ano: number
  cicloLabel?: string
  delta?: number | null
  onCanvas?: (canvas: HTMLCanvasElement, nome: string) => void
}

const W = 1080
const H = 1920
const FONT_SERIF = '"DM Serif Display", Georgia, serif'
const FONT_SANS = '"DM Sans", system-ui, sans-serif'

// Gradientes metálicos
const GRADIENTS = {
  bronze: ['#3D1A00', '#7B3F00', '#A0522D', '#7B3F00', '#3D1A00'],
  prata:  ['#6B7280', '#9CA3AF', '#D1D5DB', '#9CA3AF', '#6B7280'],
  ouro:   ['#92400E', '#D97706', '#FFD700', '#D97706', '#92400E'],
}

function drawMetallicBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tier: 'bronze' | 'prata' | 'ouro',
  pct: number,
  glow: boolean
) {
  const fillW = Math.round(w * pct / 100)
  const r = h / 2

  // Track
  ctx.save()
  ctx.fillStyle = '#161820'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
  ctx.restore()

  if (fillW < 4) return

  // Glow
  if (glow && fillW > 20) {
    ctx.save()
    const glowColor = tier === 'ouro' ? 'rgba(255,215,0,0.35)' : tier === 'prata' ? 'rgba(168,169,173,0.3)' : 'rgba(205,127,50,0.3)'
    ctx.shadowColor = glowColor
    ctx.shadowBlur = tier === 'ouro' ? 24 : 16
    ctx.fillStyle = glowColor
    ctx.beginPath()
    ctx.roundRect(x, y, fillW, h, r)
    ctx.fill()
    ctx.restore()
  }

  // Metallic fill
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, fillW, h, [r, Math.min(r, fillW > w * 0.95 ? r : 2), Math.min(r, fillW > w * 0.95 ? r : 2), r])
  ctx.clip()

  const grad = ctx.createLinearGradient(x, y, x + fillW, y + h)
  const colors = GRADIENTS[tier]
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
  ctx.fillStyle = grad
  ctx.fillRect(x, y, fillW, h)
  ctx.restore()
}

export default function CardTemplate({
  tipo, barbeiro, metaInd, lancamento, metaColetiva, premioColetivo, totalEquipe, faturamentoAcumulado, mes, ano, cicloLabel, delta, onCanvas
}: Props) {
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

    // Subtle grid texture
    ctx.strokeStyle = 'rgba(255,255,255,0.02)'
    ctx.lineWidth = 1
    for (let i = 0; i < W; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
    }
    for (let i = 0; i < H; i += 60) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
    }

    // Top accent line (gold)
    const topGrad = ctx.createLinearGradient(0, 0, W, 0)
    topGrad.addColorStop(0, 'transparent')
    topGrad.addColorStop(0.3, '#D97706')
    topGrad.addColorStop(0.5, '#FFD700')
    topGrad.addColorStop(0.7, '#D97706')
    topGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, W, 4)

    const comissao = lancamento?.comissao_acumulada ?? 0
    const tier = metaInd ? calcTier(comissao, metaInd.bronze_comm, metaInd.prata_comm, metaInd.ouro_comm) : null

    // Logo / title
    ctx.font = `400 56px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText('Barber', 80, 120)

    const metaX = 80 + ctx.measureText('Barber').width
    const metaGrad = ctx.createLinearGradient(metaX, 60, metaX + 180, 120)
    metaGrad.addColorStop(0, '#D97706')
    metaGrad.addColorStop(0.5, '#FFD700')
    metaGrad.addColorStop(1, '#D97706')
    ctx.fillStyle = metaGrad
    ctx.fillText('Meta', metaX, 120)

    // Mes/Ano ou ciclo personalizado
    ctx.font = `400 30px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.textAlign = 'left'
    const tituloPeriodo = cicloLabel ?? `${nomeMes(mes).charAt(0).toUpperCase() + nomeMes(mes).slice(1)} ${ano}`
    ctx.fillText(tituloPeriodo, 80, 164)

    // Tipo badge
    const badgeText = tipo === 'inicio' ? 'METAS DO MÊS' : 'RESULTADO FINAL'
    ctx.font = `600 22px ${FONT_SANS}`
    ctx.fillStyle = '#2563EB'
    ctx.textAlign = 'right'
    ctx.fillText(badgeText, W - 80, 120)

    // Divider
    ctx.fillStyle = '#1E2028'
    ctx.fillRect(80, 200, W - 160, 2)

    // Barbeiro name — tamanho adaptável ao comprimento do nome
    const nomeLen = barbeiro.nome.length
    const nomeFontSize = nomeLen <= 12 ? 120 : nomeLen <= 18 ? 96 : 80
    ctx.font = `400 ${nomeFontSize}px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText(barbeiro.nome, 80, 345)

    if (tipo === 'resultado') {
      // Comissão
      ctx.font = `300 36px ${FONT_SANS}`
      ctx.fillStyle = '#8B8FA8'
      ctx.fillText('Comissão acumulada', 80, 410)

      ctx.font = `400 120px ${FONT_SERIF}`
      ctx.fillStyle = '#EEF0F6'
      ctx.fillText(formatBRL(comissao), 80, 560)

      // Delta vs mesmo período do mês anterior
      if (delta !== null && delta !== undefined) {
        const arrow = delta >= 0 ? '↑' : '↓'
        const deltaText = `${arrow} ${Math.abs(delta)}% vs mês anterior`
        ctx.font = `600 34px ${FONT_SANS}`
        ctx.fillStyle = delta >= 0 ? '#22C55E' : '#EF4444'
        ctx.textAlign = 'left'
        ctx.fillText(deltaText, 80, 612)
      }

      // Tier badge
      if (tier) {
        const tierConf = TIER_CONFIG[tier]
        const badgeY = delta !== null && delta !== undefined ? 680 : 620
        const tierGradColors = GRADIENTS[tier]
        const tierGrad = ctx.createLinearGradient(80, badgeY - 50, 80 + 300, badgeY)
        tierGradColors.forEach((c, i) => tierGrad.addColorStop(i / (tierGradColors.length - 1), c))

        ctx.font = `700 52px ${FONT_SANS}`
        ctx.fillStyle = tierGrad
        ctx.textAlign = 'left'
        ctx.fillText(`★ ${tierConf.label.toUpperCase()} ATINGIDO!`, 80, badgeY)
      }
    } else {
      // Modo início: mostra as metas
      ctx.font = `300 32px ${FONT_SANS}`
      ctx.fillStyle = '#8B8FA8'
      ctx.fillText('Suas metas para o mês', 80, 400)
    }

    // Barras Bronze / Prata / Ouro
    const barY = tipo === 'resultado' ? 760 : 480
    const barH = 32
    const barW = W - 160
    const barGap = 88

    if (metaInd) {
      const tiers = [
        { key: 'bronze' as const, label: 'Bronze', meta: metaInd.bronze_comm },
        { key: 'prata'  as const, label: 'Prata',  meta: metaInd.prata_comm },
        { key: 'ouro'   as const, label: 'Ouro',   meta: metaInd.ouro_comm  },
      ]

      tiers.forEach(({ key, label, meta: metaVal }, i) => {
        const y = barY + i * barGap
        const pct = tipo === 'resultado' ? calcProgresso(comissao, metaVal) : 0
        const isCurrentTier = tier === key

        // Label
        const labelGrad = ctx.createLinearGradient(80, y - 10, 80 + 200, y + barH)
        GRADIENTS[key].forEach((c, ci) => labelGrad.addColorStop(ci / (GRADIENTS[key].length - 1), c))
        ctx.font = `600 30px ${FONT_SANS}`
        ctx.fillStyle = labelGrad
        ctx.textAlign = 'left'
        ctx.fillText(label.toUpperCase(), 80, y + 24)

        // Meta value
        ctx.font = `400 28px ${FONT_SANS}`
        ctx.fillStyle = isCurrentTier ? '#EEF0F6' : '#8B8FA8'
        ctx.textAlign = 'right'
        ctx.fillText(formatBRL(metaVal), W - 80, y + 24)

        // Bar
        drawMetallicBar(ctx, 80, y + 36, barW, barH, key, pct, isCurrentTier)

        // Percentage
        if (tipo === 'resultado') {
          ctx.font = `400 22px ${FONT_SANS}`
          ctx.fillStyle = isCurrentTier ? '#EEF0F6' : '#8B8FA8'
          ctx.textAlign = 'left'
          ctx.fillText(`${pct}%`, 80, y + 36 + barH + 24)
        }
      })
    }

    // Meta coletiva section — usa faturamentoAcumulado se disponível (igual ao dashboard)
    const faturamentoExibido = faturamentoAcumulado > 0 ? faturamentoAcumulado : totalEquipe
    const colY = tipo === 'resultado' ? 1200 : 780
    const colPct = calcProgresso(faturamentoExibido, metaColetiva)

    ctx.fillStyle = '#1E2028'
    ctx.fillRect(80, colY, W - 160, 2)

    ctx.font = `400 38px ${FONT_SERIF}`
    ctx.fillStyle = '#EEF0F6'
    ctx.textAlign = 'left'
    ctx.fillText('Meta Coletiva', 80, colY + 56)

    if (premioColetivo) {
      ctx.font = `300 26px ${FONT_SANS}`
      ctx.fillStyle = '#8B8FA8'
      ctx.fillText(premioColetivo, 80, colY + 96)
    }

    ctx.font = `300 30px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.textAlign = 'right'
    ctx.fillText(`${formatBRL(faturamentoExibido)} de ${formatBRL(metaColetiva)}`, W - 80, colY + 56)

    drawMetallicBar(ctx, 80, colY + 120, W - 160, 28, 'ouro', colPct, colPct >= 100)

    ctx.font = `400 24px ${FONT_SANS}`
    ctx.fillStyle = '#8B8FA8'
    ctx.textAlign = 'right'
    ctx.fillText(`${colPct}% atingido`, W - 80, colY + 180)

    // Insights de motivação (apenas resultado)
    if (tipo === 'resultado') {
      const insights = gerarInsightsBarbeiro({
        comissao,
        metaInd,
        posicaoRanking: 99,  // sem ranking no card individual
        totalBarbeiros: 1,   // sem ranking no card individual
        totalEquipe: faturamentoExibido,
        metaColetiva,
        barberoNome: barbeiro.nome,
      })

      if (insights.length > 0) {
        const insY = colY + 210
        ctx.fillStyle = '#1E2028'
        ctx.fillRect(80, insY, W - 160, 2)

        ctx.font = `400 26px ${FONT_SANS}`
        ctx.fillStyle = '#8B8FA8'
        ctx.textAlign = 'left'
        ctx.fillText('INSIGHTS', 80, insY + 40)

        insights.forEach((ins, i) => {
          const lineY = insY + 80 + i * 58
          ctx.font = `400 30px ${FONT_SANS}`
          ctx.fillStyle = ins.destaque ? '#EEF0F6' : '#8B8FA8'
          ctx.textAlign = 'left'
          // word-wrap manually: max ~38 chars per line
          const texto = `${ins.emoji}  ${ins.texto}`
          if (texto.length <= 44) {
            ctx.fillText(texto, 80, lineY)
          } else {
            const words = texto.split(' ')
            let line1 = '', line2 = ''
            for (const w of words) {
              if ((line1 + ' ' + w).trim().length <= 44) line1 = (line1 + ' ' + w).trim()
              else line2 = (line2 + ' ' + w).trim()
            }
            ctx.fillText(line1, 80, lineY)
            if (line2) {
              ctx.font = `400 26px ${FONT_SANS}`
              ctx.fillStyle = '#6B7280'
              ctx.fillText(line2, 80, lineY + 34)
            }
          }
        })
      }
    }

    // Bottom accent
    const botGrad = ctx.createLinearGradient(0, H - 4, W, H)
    botGrad.addColorStop(0, 'transparent')
    botGrad.addColorStop(0.5, '#2563EB')
    botGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, H - 4, W, 4)

    // Watermark
    ctx.font = `300 22px ${FONT_SANS}`
    ctx.fillStyle = 'rgba(139,143,168,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText('barbermeta.com.br', W / 2, H - 40)

    onCanvas?.(canvas, barbeiro.nome)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiro.id, tipo, lancamento?.comissao_acumulada, mes, ano, delta, cicloLabel])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
    />
  )
}
