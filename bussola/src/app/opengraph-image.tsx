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
        <svg width="200" height="200" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <circle cx="256" cy="256" r="180" fill="none" stroke="#8B6F47" strokeWidth="20" />
          <path d="M 256 100 L 310 256 L 256 256 Z" fill="#5C4A30" />
          <path d="M 256 100 L 202 256 L 256 256 Z" fill="#8B6F47" />
          <path d="M 256 412 L 310 256 L 256 256 Z" fill="#8B6F47" />
          <path d="M 256 412 L 202 256 L 256 256 Z" fill="#A88A5E" />
          <circle cx="256" cy="256" r="14" fill="#FFFFFF" />
        </svg>
        <div
          style={{
            fontSize: 120,
            color: '#0F0F0F',
            fontFamily: 'serif',
            fontWeight: 700,
            letterSpacing: '-3px',
            marginTop: 30,
          }}
        >
          Bússola
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#5A4A38',
            marginTop: 16,
            fontFamily: 'sans-serif',
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
