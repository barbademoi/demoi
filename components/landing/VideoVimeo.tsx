'use client'

import { useEffect, useRef, useState } from 'react'
import { trackPlayVideoHeroSom } from '@/lib/pixel'

// Player 16:9 do Vimeo, EMBUTIDO na página (nunca modal). Começa sozinho e
// MUDO — navegador nenhum deixa autoplay com som — em loop. O aviso "🔊 Clique
// para ativar o som" tira o mudo NO MESMO player, via player.js, sem recarregar
// o iframe e sem voltar o vídeo pro começo.

const VIDEO_ID = '1219316323'

// HASH DE PRIVACIDADE — obrigatório. O vídeo é restrito: sem `h=`, o embed
// responde com erro de permissão e a seção fica com um retângulo preto. Ele
// precisa vir na URL do iframe, não adianta passar depois pela API.
const HASH = '0f9ca78c00'

const PARAMS = new URLSearchParams({
  h: HASH,
  autoplay: '1',
  muted: '1',
  loop: '1',
  background: '0', // queremos os controles à vista, não o modo decorativo
  title: '0',
  byline: '0',
  portrait: '0',
  dnt: '1', // do-not-track: o Vimeo não grava cookie de identificação
  playsinline: '1', // iPhone toca embutido em vez de abrir em tela cheia
})

const SRC = `https://player.vimeo.com/video/${VIDEO_ID}?${PARAMS.toString()}`

const SDK_ID = 'vimeo-player-api'
const SDK_SRC = 'https://player.vimeo.com/api/player.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
type VimeoPlayer = any

declare global {
  interface Window {
    Vimeo?: { Player: new (el: HTMLIFrameElement | HTMLElement) => VimeoPlayer }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function carregarSdk(): Promise<void> {
  if (window.Vimeo?.Player) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existente = document.getElementById(SDK_ID) as HTMLScriptElement | null
    if (existente) {
      existente.addEventListener('load', () => resolve())
      existente.addEventListener('error', () => reject(new Error('sdk')))
      return
    }
    const s = document.createElement('script')
    s.id = SDK_ID
    s.src = SDK_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('sdk'))
    document.body.appendChild(s)
  })
}

export default function VideoVimeo() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer>(null)
  const [mudo, setMudo] = useState(true)

  useEffect(() => {
    let cancelado = false

    carregarSdk()
      .then(() => {
        if (cancelado || !iframeRef.current || !window.Vimeo?.Player) return

        // O player é ANEXADO ao iframe que o React já renderizou — não é ele
        // que cria o elemento. Assim o React continua dono do nó, e sair da
        // landing por link interno não quebra a desmontagem.
        const p = new window.Vimeo.Player(iframeRef.current)
        playerRef.current = p

        p.setLoop?.(true)?.catch?.(() => {})
        p.setMuted?.(true)?.catch?.(() => {})
        p.play?.()?.catch?.(() => {
          // Autoplay recusado (alguns navegadores com economia de bateria):
          // os controles do player continuam ali pra quem quiser dar play.
        })

        // Se a pessoa tirar o mudo pelos controles nativos, o aviso some
        // junto — ele não pode continuar pedindo o que já foi feito.
        p.on?.('volumechange', ({ volume }: { volume: number }) => {
          p.getMuted?.().then((m: boolean) => {
            if (!cancelado) setMudo(Boolean(m) || volume === 0)
          }).catch(() => {})
        })
      })
      .catch(() => {
        // Sem SDK o iframe continua tocando pelos parâmetros da URL; só o
        // botão de som deixa de funcionar. Nada some da tela.
      })

    return () => {
      cancelado = true
      try { playerRef.current?.unload?.() } catch { /* noop */ }
      try { playerRef.current?.destroy?.() } catch { /* noop */ }
    }
  }, [])

  function ativarSom() {
    const p = playerRef.current
    // setMuted/setVolume NÃO reposicionam o vídeo: ele segue de onde estava.
    p?.setMuted?.(false)?.catch?.(() => {})
    p?.setVolume?.(1)?.catch?.(() => {})
    p?.play?.()?.catch?.(() => {})
    setMudo(false)
    trackPlayVideoHeroSom()
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
      <iframe
        ref={iframeRef}
        src={SRC}
        title="Conheça o BarberMeta por dentro"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
        // O sandbox é a garantia DURA de que ninguém sai da landing por causa
        // do vídeo: sem `allow-top-navigation`, nada dentro do iframe consegue
        // trocar o endereço da página. `allow-popups` fica ligado só pra que um
        // clique no logo do Vimeo abra em aba nova em vez de morrer calado.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
      {mudo && (
        <button
          type="button"
          onClick={ativarSom}
          aria-label="Clique para ativar o som do vídeo"
          // `whitespace-nowrap` porque um absoluto com `left-1/2` só enxerga
          // metade da largura do player como espaço disponível — no celular o
          // aviso quebrava em duas linhas e virava um bloco no meio do vídeo.
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 animate-pulse whitespace-nowrap rounded-full bg-latao px-4 py-2 text-xs font-bold text-carvao shadow-lg transition-transform hover:scale-105 sm:top-4 sm:text-sm"
        >
          🔊 Clique para ativar o som
        </button>
      )}
    </div>
  )
}
