import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Apple touch icon: símbolo da bússola sobre fundo bege. Sem cantos
// arredondados porque o iOS aplica sua própria máscara.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F5F1EA',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <circle cx="256" cy="256" r="180" fill="none" stroke="#8B6F47" strokeWidth="20" />
          <path d="M 256 100 L 310 256 L 256 256 Z" fill="#5C4A30" />
          <path d="M 256 100 L 202 256 L 256 256 Z" fill="#8B6F47" />
          <path d="M 256 412 L 310 256 L 256 256 Z" fill="#8B6F47" />
          <path d="M 256 412 L 202 256 L 256 256 Z" fill="#A88A5E" />
          <circle cx="256" cy="256" r="14" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
