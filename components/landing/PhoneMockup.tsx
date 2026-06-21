// Moldura visual estilo iPhone (com notch) pra prints de tela mobile e
// screenshots de WhatsApp. Borda preta arredondada + entalhe no topo.

import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  // largura maxima do iPhone — default centralizado e constrained
  maxWidth?: number | string
}

export default function PhoneMockup({
  children,
  className = '',
  maxWidth = 260,
}: Props) {
  return (
    <div
      className={`relative rounded-[36px] border-[7px] border-[#0F1117] bg-[#0F1117] shadow-2xl overflow-hidden mx-auto ${className}`}
      style={{ maxWidth }}
    >
      {/* notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0F1117] rounded-b-2xl z-10" />
      <div className="block">{children}</div>
    </div>
  )
}
