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
    default: 'Bússola — Reuniões com clareza',
    template: '%s | Bússola',
  },
  description: 'Mentor de reuniões semanais com IA pra empresas pequenas e médias.',
  openGraph: {
    title: 'Bússola',
    description: 'Mentor de reuniões semanais com IA',
    url: APP_URL,
    siteName: 'Bússola',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bússola',
    description: 'Mentor de reuniões semanais com IA',
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
