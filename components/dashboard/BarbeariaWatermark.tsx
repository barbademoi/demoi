interface Props {
  logoUrl: string | null
}

/**
 * Marca d'água sutil da logo da barbearia, posicionada no canto inferior
 * direito da tela. Não interage com o conteúdo (pointer-events-none) e
 * fica atrás de tudo (z-0 absoluto no fluxo do parent).
 */
export default function BarbeariaWatermark({ logoUrl }: Props) {
  if (!logoUrl) return null

  return (
    <div
      aria-hidden
      className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 pointer-events-none select-none z-0 opacity-[0.04]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain"
      />
    </div>
  )
}
