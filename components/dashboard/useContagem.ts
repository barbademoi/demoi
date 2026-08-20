'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * ANIMAÇÃO DOS NÚMEROS DO RANKING.
 *
 * Contar de zero até o valor é o que dá a sensação de conquista quando a tela
 * abre — mas movimento não é opcional pra quem tem enxaqueca vestibular ou
 * sensibilidade a animação. Por isso todo mundo aqui respeita
 * `prefers-reduced-motion`: quem pediu menos movimento vê o número final na
 * hora, sem transição nenhuma.
 */

export function usePrefereMenosMovimento(): boolean {
  const [reduz, setReduz] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduz(mq.matches)
    const aoMudar = () => setReduz(mq.matches)
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  return reduz
}

/**
 * Conta de 0 até `alvo` com desaceleração no fim (easeOutCubic) — o número
 * chega quase lá rápido e "assenta" nos últimos décimos, que é o que faz a
 * contagem parecer um resultado e não um cronômetro.
 */
export function useContagem(alvo: number, duracaoMs = 900): number {
  const reduz = usePrefereMenosMovimento()
  const [valor, setValor] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reduz || alvo === 0) {
      setValor(alvo)
      return
    }

    let inicio: number | null = null
    const passo = (t: number) => {
      if (inicio === null) inicio = t
      const p = Math.min(1, (t - inicio) / duracaoMs)
      setValor(alvo * (1 - Math.pow(1 - p, 3)))
      if (p < 1) rafRef.current = requestAnimationFrame(passo)
    }
    rafRef.current = requestAnimationFrame(passo)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [alvo, duracaoMs, reduz])

  return valor
}

/**
 * `false` no primeiro render, `true` logo depois. É o gatilho das barras: elas
 * nascem com largura zero e a transição do CSS faz o resto — sem um rAF por
 * barra, que com dez barbeiros na tela viraria dezenas de loops simultâneos.
 */
export function useMontado(): boolean {
  const [montado, setMontado] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return montado
}
