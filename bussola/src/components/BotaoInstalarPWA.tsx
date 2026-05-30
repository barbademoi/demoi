'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import Modal from '@/components/Modal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Botão "Salvar na tela inicial":
// - Chrome/Edge/Samsung Android: captura beforeinstallprompt e chama prompt() ao clicar.
// - iOS Safari: não tem o evento, abre modal com instruções visuais de 3 passos.
// - Se app já está em standalone (instalado), some.
// - Em browsers que não suportam (Firefox desktop etc.), também some.
export default function BotaoInstalarPWA({
  texto = 'Salvar na tela inicial',
  className = '',
}: {
  texto?: string
  className?: string
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // default true = não mostra até confirmar
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Já instalado?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    // iOS Safari (não Chrome/Firefox no iOS — esses não instalam PWA).
    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    setIsIOS(ios)

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (isStandalone) return null

  // iOS: botão que abre modal de instruções.
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSModal(true)}
          className={`btn-secondary ${className}`}
        >
          <Download size={18} strokeWidth={1.5} /> {texto}
        </button>
        <Modal open={showIOSModal} onClose={() => setShowIOSModal(false)}>
          <div className="p-5">
            <h4 className="font-semibold text-text mb-3 inline-flex items-center gap-2">
              <Smartphone size={20} strokeWidth={1.5} color="#8B6F47" /> Adicionar à tela inicial
            </h4>
            <ol className="space-y-3 text-sm text-grafite">
              <li>
                <strong className="text-text">1.</strong> Toque no botão de compartilhar (ícone na barra inferior do Safari).
              </li>
              <li>
                <strong className="text-text">2.</strong> Role e toque em <strong>&ldquo;Adicionar à Tela Inicial&rdquo;</strong>.
              </li>
              <li>
                <strong className="text-text">3.</strong> Confirme tocando em <strong>&ldquo;Adicionar&rdquo;</strong>.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="btn-primary w-full mt-5"
            >
              Entendi
            </button>
          </div>
        </Modal>
      </>
    )
  }

  // Android/Chrome/Edge: só mostra se evento foi capturado.
  if (!deferredPrompt) return null

  async function instalar() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return (
    <button type="button" onClick={instalar} className={`btn-secondary ${className}`}>
      <Download size={18} strokeWidth={1.5} /> {texto}
    </button>
  )
}
