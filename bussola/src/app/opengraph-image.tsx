import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bússola — Reuniões com clareza'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F1EA',
          padding: 80,
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: '#8B6F47',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 140,
            fontWeight: 700,
            fontFamily: 'serif',
            marginBottom: 40,
          }}
        >
          B
        </div>
        <div
          style={{
            fontSize: 96,
            color: '#0F0F0F',
            fontWeight: 700,
            fontFamily: 'serif',
            letterSpacing: '-2px',
          }}
        >
          Bússola
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#5A4A38',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Reuniões com clareza, semana após semana.
        </div>
      </div>
    ),
    { ...size },
  )
}
