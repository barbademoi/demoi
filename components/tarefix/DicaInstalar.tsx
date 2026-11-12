'use client'

import { useEffect, useState } from 'react'

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const CHAVE = 'tarefix-dica-instalar'

/**
 * Dica para o colaborador colocar o link na tela inicial do celular.
 * Android/Chrome: botão que abre o "Instalar". iPhone: instrução do Compartilhar.
 * Some se já estiver instalado ou se a pessoa dispensar.
 */
export function DicaInstalar() {
  const [modo, setModo] = useState<'android' | 'ios' | null>(null)
  const [evento, setEvento] = useState<EventoInstalar | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(CHAVE) === 'dispensada') return
    } catch {
      /* segue */
    }
    const instalado = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
    if (instalado) return
    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua)) setModo('ios')
    const aoPoder = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
      setModo('android')
    }
    window.addEventListener('beforeinstallprompt', aoPoder)
    return () => window.removeEventListener('beforeinstallprompt', aoPoder)
  }, [])

  function dispensar() {
    setModo(null)
    try {
      localStorage.setItem(CHAVE, 'dispensada')
    } catch {
      /* ok */
    }
  }

  if (!modo) return null
  return (
    <div className="tf-cartao mt-4 flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">Deixe o Tarefix na tela inicial</p>
        {modo === 'ios' ? (
          <p className="mt-0.5 text-tf-suave">
            Toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>.
          </p>
        ) : (
          <button
            type="button"
            className="mt-2 font-bold text-tf-marca-texto underline"
            onClick={async () => {
              if (!evento) return
              await evento.prompt()
              await evento.userChoice
              dispensar()
            }}
          >
            Instalar agora
          </button>
        )}
      </div>
      <button type="button" onClick={dispensar} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-tf-suave" aria-label="Dispensar dica">
        ×
      </button>
    </div>
  )
}
