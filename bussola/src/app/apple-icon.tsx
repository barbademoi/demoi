import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Apple touch icon: letra "B" branca sobre fundo marrom.
export default function AppleIcon() {
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
          fontSize: 130,
          fontWeight: 400,
          color: '#FFFFFF',
          fontFamily: 'serif',
          lineHeight: 1,
          paddingBottom: 10,
        }}
      >
        B
      </div>
    ),
    { ...size },
  )
}
