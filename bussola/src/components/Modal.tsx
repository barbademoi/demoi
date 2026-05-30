'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  // Largura máxima do conteúdo (padrão max-w-md).
  width?: string
}

// Modal nativo usando o elemento <dialog>. Resolve de uma vez:
// - Centralização no centro real da viewport (top layer do navegador)
// - Body scroll lock (showModal trata)
// - Briga de z-index (top layer ignora z-index das outras camadas)
// - ESC pra fechar (nativo)
// - Foco gerenciado (nativo)
//
// Funciona em todos os browsers modernos (iOS 15.4+, Chrome, Firefox, Edge).
export default function Modal({ open, onClose, children, width = 'max-w-md' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // Fechar ao clicar no backdrop (fora do conteúdo).
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={onDialogClick}
      className={`${width} w-full bg-transparent p-0 max-h-[90dvh] backdrop:bg-black/40 [&:not([open])]:hidden`}
    >
      <div className="bg-surface rounded-lg w-full max-h-[90dvh] overflow-y-auto">
        {children}
      </div>
    </dialog>
  )
}
