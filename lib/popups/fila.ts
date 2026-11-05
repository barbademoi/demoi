'use client'

/**
 * FILA DE POPUPS AUTOMÁTICOS — um por vez, na ordem de importância.
 *
 * ── O PROBLEMA ──────────────────────────────────────────────────────────────
 * O dashboard tinha três modais que abrem SOZINHOS, cada um com seu próprio
 * `setTimeout` e sem saber da existência dos outros: o lembrete de meta
 * (900ms), a oferta da Brindoleta (700ms) e o lançamento da Brindoleta
 * (1100ms). Nada impedia dois de nascerem na mesma carga — um por cima do
 * outro, com dois overlays, dois `body.overflow = hidden` e o de baixo
 * inalcançável. A única proteção era no servidor, e só entre dois deles
 * (`popupBrindoleta={lembreteMeta ? null : popupBrindoleta}`), decidida uma
 * carga antes de qualquer um existir.
 *
 * ── A REGRA ─────────────────────────────────────────────────────────────────
 * Cada popup automático ANUNCIA que quer aparecer no momento em que monta, e
 * só abre quando é a vez dele. É a vez de quem tem a maior prioridade entre os
 * que estão esperando, e só se não houver nenhum aberto. Quando o que está na
 * tela fecha, o próximo da fila é avisado e abre em seguida — ou, se a pessoa
 * sair da página antes, ele aparece no próximo acesso.
 *
 * Anunciar NO MONTE, e não no fim do `setTimeout`, é o detalhe que faz a fila
 * funcionar: se cada um só entrasse na fila ao abrir, o de timer mais curto
 * sempre ganharia, independentemente de importância.
 *
 * ── POR QUE UM SINGLETON DE MÓDULO, E NÃO CONTEXT ───────────────────────────
 * Os três popups moram em lugares distantes da árvore (um na página, um no
 * shell, um na sidebar), e dois deles são montados por server components. Um
 * provider teria de ser enfiado acima de tudo isso só para eles se verem. O
 * estado aqui é global por natureza — existe UMA tela — e um módulo resolve
 * sem mexer na hierarquia.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Prioridade: MENOR número ganha.
 *
 * A ordem é de obrigação, não de novidade. Primeiro o que a pessoa precisa
 * resolver (dinheiro, meta do ciclo), depois o que o BarberMeta quer contar
 * (Brindoleta), e por último o lembrete educativo — que volta todo dia e pode
 * muito bem esperar amanhã.
 */
export const PRIORIDADE = {
  /** Assinatura/cobrança. Hoje é banner, não modal; o lugar fica reservado. */
  'assinatura': 0,
  'lembrete-meta': 1,
  'brindoleta-lancamento': 2,
  'brindoleta-oferta': 3,
  'aviso-lancamento': 4,
} as const

export type PopupId = keyof typeof PRIORIDADE

const esperando = new Set<PopupId>()
let aberto: PopupId | null = null
const ouvintes = new Set<() => void>()

function avisar() {
  // Cópia antes de iterar: um ouvinte pode se remover durante o aviso.
  for (const f of Array.from(ouvintes)) f()
}

/** De quem é a vez agora. null = ninguém espera, ou há um aberto. */
function vezDe(): PopupId | null {
  if (aberto !== null) return null
  let melhor: PopupId | null = null
  // `Array.from` e não `for..of` direto no Set: o target de compilação do
  // projeto é anterior a es2015 pra iteradores.
  for (const id of Array.from(esperando)) {
    if (melhor === null || PRIORIDADE[id] < PRIORIDADE[melhor]) melhor = id
  }
  return melhor
}

/** Só para teste: devolve a fila ao estado inicial. */
export function limparFila() {
  esperando.clear()
  aberto = null
  avisar()
}

/** Só para teste/diagnóstico. */
export function estadoDaFila(): { esperando: PopupId[]; aberto: PopupId | null; vez: PopupId | null } {
  return { esperando: Array.from(esperando), aberto, vez: vezDe() }
}

export function entrarNaFila(id: PopupId) {
  if (esperando.has(id)) return
  esperando.add(id)
  avisar()
}

export function sairDaFila(id: PopupId) {
  const tinha = esperando.delete(id)
  // Quem desiste enquanto está aberto também libera a tela.
  if (aberto === id) { aberto = null; if (!tinha) avisar() }
  if (tinha || aberto === null) avisar()
}

export function abrirNaFila(id: PopupId) {
  // Sai de `esperando` ao abrir: quem está na tela não está mais na fila.
  esperando.delete(id)
  aberto = id
  avisar()
}

export function fecharNaFila(id: PopupId) {
  if (aberto === id) aberto = null
  esperando.delete(id)
  avisar()
}

/**
 * Hook de um popup automático.
 *
 * `quer` diz se ele tem algo a mostrar nesta carga — já descontando as regras
 * próprias dele (visto hoje, visto nesta sessão, prazo de reexibição…). Passar
 * `false` é sair da fila e deixar a vez para o próximo.
 *
 * Devolve `minhaVez`, que fica true quando ele pode aparecer, e as duas
 * funções que o popup chama ao abrir e ao fechar de fato.
 */
export function useFilaDePopups(id: PopupId, quer: boolean) {
  const [minhaVez, setMinhaVez] = useState(false)
  // `abertoAqui` evita que o popup se feche sozinho quando a fila avisa: uma
  // vez aberto, quem manda nele é o usuário, não a fila.
  const abertoAqui = useRef(false)

  useEffect(() => {
    if (!quer) {
      sairDaFila(id)
      setMinhaVez(false)
      return
    }

    const recalcular = () => {
      if (abertoAqui.current) return
      setMinhaVez(vezDe() === id)
    }

    ouvintes.add(recalcular)
    entrarNaFila(id)
    recalcular()

    return () => {
      ouvintes.delete(recalcular)
      // Desmontou sem fechar (navegação, por exemplo): libera a tela para o
      // próximo em vez de deixar a fila travada num popup que não existe mais.
      if (abertoAqui.current) {
        abertoAqui.current = false
        fecharNaFila(id)
      } else {
        sairDaFila(id)
      }
    }
  }, [id, quer])

  const abrir = useCallback(() => {
    abertoAqui.current = true
    abrirNaFila(id)
  }, [id])

  const fechar = useCallback(() => {
    abertoAqui.current = false
    setMinhaVez(false)
    fecharNaFila(id)
  }, [id])

  return { minhaVez, abrir, fechar }
}
