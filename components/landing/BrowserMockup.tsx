// Moldura visual estilo macOS Safari pra prints de tela desktop.
// 3 bolinhas + barra de URL fake + conteudo abaixo.
// Use pra dashboards / paineis web.

import type { ReactNode } from 'react'

interface Props {
  url?: string
  children: ReactNode
  className?: string
  // max width do mockup inteiro (default = constrain por contexto)
  maxWidth?: number | string
}

export default function BrowserMockup({
  url = 'barbermeta.com.br/dashboard',
  children,
  className = '',
  maxWidth,
}: Props) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-white/15 bg-[#0F1117] shadow-2xl ${className}`}
      style={maxWidth ? { maxWidth, marginInline: 'auto' } : undefined}
    >
      <div className="bg-[#161820] h-7 flex items-center px-3 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="mx-auto rounded-md bg-[#0A1929] border border-white/10 px-2 py-0.5 text-[10px] text-[#A0AEC0] font-mono truncate max-w-[60%]">
          {url}
        </div>
      </div>
      <div className="block">{children}</div>
    </div>
  )
}
