import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

// Ícone PWA: letra "B" branca sobre fundo marrom. Sintaxe simples
// suportada pelo satori (renderizador do ImageResponse) — SVG inline
// estava quebrando em produção.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#8B6F47',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 140,
          fontWeight: 400,
          color: '#FFFFFF',
          fontFamily: 'serif',
          lineHeight: 1,
          paddingBottom: 12,
        }}
      >
        B
      </div>
    ),
    { ...size },
  )
}
