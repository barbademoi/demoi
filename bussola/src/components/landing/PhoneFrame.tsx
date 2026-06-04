interface PhoneFrameProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Moldura estilizada de celular pra envelopar vídeos verticais (9:16)
// gravados no celular. Faz parecer mockup, não vídeo solto.
const WIDTHS: Record<NonNullable<PhoneFrameProps['size']>, string> = {
  sm: 'max-w-[240px]',
  md: 'max-w-[280px]',
  lg: 'max-w-[320px]',
}

export function PhoneFrame({ children, size = 'md', className = '' }: PhoneFrameProps) {
  return (
    <div className={`relative mx-auto ${WIDTHS[size]} ${className}`}>
      <div className="relative rounded-[2rem] bg-preto p-2 shadow-2xl ring-1 ring-border">
        {/* Notch decorativo no topo */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-grafite rounded-full z-10"
          aria-hidden
        />
        <div className="aspect-[9/19.5] rounded-[1.5rem] overflow-hidden bg-areia">
          {children}
        </div>
      </div>
    </div>
  )
}
