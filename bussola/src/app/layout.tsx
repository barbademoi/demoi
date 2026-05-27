import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@fontsource/dm-serif-display'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bússola',
  description: 'Gestão de pessoas e reuniões semanais para donos de barbearia',
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
