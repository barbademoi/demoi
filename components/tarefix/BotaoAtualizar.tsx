'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Botão "atualizar" (setas girando). Sem `aoAtualizar`, recarrega os dados da
 * página do servidor (router.refresh). Também atualiza sozinho quando o app
 * volta para a frente e, se `intervaloSeg` for passado, de tempos em tempos
 * enquanto a tela estiver visível.
 */
export function BotaoAtualizar({
  aoAtualizar,
  intervaloSeg,
  className = '',
}: {
  aoAtualizar?: () => Promise<void>
  intervaloSeg?: number
  className?: string
}) {
  const router = useRouter()
  const [pendenteRota, iniciar] = useTransition()
  const [girando, setGirando] = useState(false)
  const fn = useRef(aoAtualizar)
  fn.current = aoAtualizar
  const ultima = useRef(Date.now())

  const atualizar = useCallback(async () => {
    ultima.current = Date.now()
    if (fn.current) {
      setGirando(true)
      try {
        await fn.current()
      } finally {
        setGirando(false)
      }
    } else {
      iniciar(() => router.refresh())
    }
  }, [router])

  useEffect(() => {
    // voltou para o app (desbloqueou o celular, trocou de aba…) → atualiza, se faz mais de 20 s
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultima.current > 20_000) atualizar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    let id: ReturnType<typeof setInterval> | undefined
    if (intervaloSeg) {
      id = setInterval(() => {
        if (document.visibilityState === 'visible') atualizar()
      }, intervaloSeg * 1000)
    }
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      if (id) clearInterval(id)
    }
  }, [atualizar, intervaloSeg])

  const ocupado = girando || pendenteRota
  return (
    <button
      type="button"
      onClick={atualizar}
      disabled={ocupado}
      aria-label={ocupado ? 'Atualizando…' : 'Atualizar'}
      title="Atualizar"
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tf-texto transition hover:bg-tf-marca-clara disabled:opacity-60 ${className}`}
    >
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${ocupado ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a9 9 0 01-15.5 6.3L3 16" />
        <path d="M3 12a9 9 0 0115.5-6.3L21 8" />
        <path d="M21 3v5h-5M3 21v-5h5" />
      </svg>
    </button>
  )
}
