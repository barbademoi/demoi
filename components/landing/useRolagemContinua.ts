'use client'

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

/**
 * MOTOR DE ROLAGEM CONTÍNUA dos carrosséis da landing.
 *
 * Extraído do carrossel de crescimento, que já rodava assim, para que o
 * carrossel de depoimentos ande sozinho com o MESMO comportamento em vez de
 * ganhar uma segunda cópia da lógica que podia divergir.
 *
 * O movimento é feito em `scrollLeft`, e não com `transform`: assim a rolagem
 * automática e a rolagem manual são a mesma coisa para o navegador. O dedo, a
 * roda do mouse, o arraste e as setas do teclado continuam funcionando durante
 * o movimento — não há nada a "desligar" antes de o usuário assumir o controle.
 *
 * Por isso a faixa também NÃO pode usar scroll-snap obrigatório: o snap puxaria
 * a rolagem de volta ao ponto de encaixe a cada quadro e travaria o movimento.
 *
 * Pausa em três situações, e cada uma tem seu motivo:
 *   - ponteiro em cima ou arrastando: quem parou para ler manda no carrossel;
 *   - aba em segundo plano: rolar sem ninguém vendo só gasta bateria;
 *   - `prefers-reduced-motion`: quem pediu menos movimento não recebe nenhum.
 *
 * A retomada é atrasada em ~1,8s depois da interação, para o carrossel não
 * arrancar debaixo do dedo assim que o arraste termina.
 */

const RETOMAR_APOS_MS = 1800

export function useRolagemContinua(velocidadePxPorMs: number) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const pausadoRef = useRef(false)
  const retomadaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arrasteRef = useRef({ ativo: false, xInicial: 0, rolagemInicial: 0 })

  const cancelarRetomada = () => {
    if (retomadaRef.current) {
      clearTimeout(retomadaRef.current)
      retomadaRef.current = null
    }
  }

  const pausar = () => {
    cancelarRetomada()
    pausadoRef.current = true
  }

  const retomarDepois = () => {
    cancelarRetomada()
    retomadaRef.current = setTimeout(() => {
      pausadoRef.current = false
      retomadaRef.current = null
    }, RETOMAR_APOS_MS)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const preferenciaDeMovimento = window.matchMedia('(prefers-reduced-motion: reduce)')
    let quadro = 0
    let anterior = performance.now()

    // A POSIÇÃO É GUARDADA AQUI, EM PONTO FLUTUANTE, e não lida de volta do
    // `scrollLeft` a cada quadro. Esse é o detalhe que faz o carrossel andar:
    // o navegador arredonda `scrollLeft` para o pixel do dispositivo, e o passo
    // de um quadro é fração de pixel (~0,4px a 60fps). Somando direto no
    // elemento — `scrollLeft += 0.4` — cada quadro é arredondado de volta para
    // o mesmo lugar e a faixa fica parada; em tela retina, parada de vez.
    // Acumulando fora e escrevendo o total, o resto fracionário sobrevive e
    // vira movimento a cada 2 ou 3 quadros.
    let posicao = viewport.scrollLeft

    const animar = (agora: number) => {
      const intervalo = Math.min(agora - anterior, 50)
      anterior = agora

      if (!pausadoRef.current && !preferenciaDeMovimento.matches && !document.hidden) {
        // A faixa contém o mesmo grupo duas vezes; ao passar da metade, volta
        // uma metade para trás. O salto cai exatamente sobre o card idêntico,
        // então o laço é invisível.
        const larguraDoCiclo = viewport.scrollWidth / 2

        if (larguraDoCiclo > 0) {
          // Se o valor real se afastou do acumulado, quem mexeu foi o usuário
          // (arraste, roda, teclado) ou o próprio arredondamento do laço:
          // a posição dele vale mais que a nossa.
          if (Math.abs(viewport.scrollLeft - posicao) > 2) {
            posicao = viewport.scrollLeft
          }

          posicao += intervalo * velocidadePxPorMs

          if (posicao >= larguraDoCiclo) {
            posicao -= larguraDoCiclo
          }

          viewport.scrollLeft = posicao
        }
      }

      quadro = window.requestAnimationFrame(animar)
    }

    quadro = window.requestAnimationFrame(animar)

    return () => {
      window.cancelAnimationFrame(quadro)
      cancelarRetomada()
    }
  }, [velocidadePxPorMs])

  const iniciarInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    pausar()

    // Só o mouse ganha arraste manual: no toque, a rolagem nativa do navegador
    // já é melhor do que qualquer coisa que a gente reimplemente.
    if (evento.pointerType !== 'mouse') return

    const viewport = viewportRef.current
    if (!viewport) return

    arrasteRef.current = {
      ativo: true,
      xInicial: evento.clientX,
      rolagemInicial: viewport.scrollLeft,
    }
    viewport.setPointerCapture(evento.pointerId)
  }

  const moverInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== 'mouse' || !arrasteRef.current.ativo) return

    const viewport = viewportRef.current
    if (!viewport) return

    evento.preventDefault()
    viewport.scrollLeft = arrasteRef.current.rolagemInicial - (evento.clientX - arrasteRef.current.xInicial)
  }

  const finalizarInteracao = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.pointerType === 'mouse' && arrasteRef.current.ativo) {
      arrasteRef.current.ativo = false
      const viewport = viewportRef.current

      if (viewport?.hasPointerCapture(evento.pointerId)) {
        viewport.releasePointerCapture(evento.pointerId)
      }
    }

    retomarDepois()
  }

  return {
    viewportRef,
    // Espalhar direto no elemento que rola.
    propsDoViewport: {
      onPointerDown: iniciarInteracao,
      onPointerMove: moverInteracao,
      onPointerUp: finalizarInteracao,
      onPointerCancel: finalizarInteracao,
      onMouseEnter: pausar,
      onMouseLeave: retomarDepois,
      // Teclado e leitor de tela também param o movimento: dar Tab num link
      // dentro da faixa não pode fazer o alvo fugir.
      onFocusCapture: pausar,
      onBlurCapture: retomarDepois,
    },
  }
}
