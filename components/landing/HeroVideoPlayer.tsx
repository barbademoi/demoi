'use client'

import { useEffect, useRef, useState } from 'react'
import { trackPlayVideoHeroSom } from '@/lib/pixel'

// Player 16:9 HORIZONTAL do hero. Toca DENTRO da página, começa SOZINHO e MUDO
// (autoplay só é permitido mudo), em LOOP. Aviso sobreposto "🔊 Clique para
// ativar o som" dá unMute no MESMO player (sem reiniciar) via a IFrame Player
// API do YouTube. Responsivo: preenche o container (o pai limita a largura).
const VIDEO_ID = '7ENkgsYi2-w'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type YTPlayer = any

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

export default function HeroVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer>(null)
  const [mudo, setMudo] = useState(true)

  useEffect(() => {
    let cancelado = false

    function criarPlayer() {
      if (cancelado || !containerRef.current || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: VIDEO_ID, // necessário pro loop de vídeo único
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.mute()
            e.target.playVideo()
          },
        },
      })
    }

    if (window.YT?.Player) {
      criarPlayer()
    } else {
      const anterior = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { anterior?.(); criarPlayer() }
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script')
        s.id = 'yt-iframe-api'
        s.src = 'https://www.youtube.com/iframe_api'
        document.body.appendChild(s)
      }
    }

    return () => {
      cancelado = true
      try { playerRef.current?.destroy?.() } catch { /* noop */ }
    }
  }, [])

  function ativarSom() {
    const p = playerRef.current
    if (p) {
      p.unMute?.()
      p.setVolume?.(100)
      p.playVideo?.()
    }
    setMudo(false)
    trackPlayVideoHeroSom()
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {mudo && (
        <button
          type="button"
          onClick={ativarSom}
          aria-label="Clique para ativar o som do vídeo"
          className="absolute left-1/2 top-4 z-10 -translate-x-1/2 animate-pulse rounded-full bg-[#D4A85A] px-4 py-2 text-sm font-bold text-black shadow-lg transition-transform hover:scale-105"
        >
          🔊 Clique para ativar o som
        </button>
      )}
    </div>
  )
}
