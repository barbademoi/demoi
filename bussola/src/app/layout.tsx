import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@fontsource/dm-serif-display'
import './globals.css'
import { APP_URL } from '@/lib/urlBase'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Bússola — IA mentora pra construir cultura na sua empresa',
    template: '%s | Bússola',
  },
  description:
    'IA mentora pra construir cultura na sua empresa. R$ 97 pelo ano todo + 2 bônus exclusivos (Encontro da Cultura + Suporte WhatsApp). Vagas limitadas aos primeiros 100 clientes.',
  openGraph: {
    title: 'Bússola — IA mentora pra construir cultura',
    description:
      'IA mentora pra construir cultura na sua empresa. R$ 97 pelo ano todo + 2 bônus exclusivos.',
    url: APP_URL,
    siteName: 'Bússola',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bússola — IA mentora pra construir cultura',
    description: 'R$ 97 pelo ano todo + 2 bônus exclusivos.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  )
}
