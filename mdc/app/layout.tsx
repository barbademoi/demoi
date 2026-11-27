import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://metododemoi.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'MDC — Método Demôi de Crescimento',
  description:
    'Mentoria em grupo pra dono de barbearia do interior. Rotina, equipe e números no lugar em 90 dias.',
  openGraph: {
    title: 'MDC — Método Demôi de Crescimento',
    description: 'Rotina, equipe e números no lugar em 90 dias.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0B0C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-fundo font-sans text-texto antialiased">{children}</body>
    </html>
  )
}
