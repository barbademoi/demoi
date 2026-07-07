import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, DM_Sans, Inter } from 'next/font/google'
import './globals.css'
import MetaPixel from '@/components/MetaPixel'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// Inter — fonte de interface do redesign (aplicada só onde referenciada,
// via a var CSS; carregá-la aqui não muda nada por si só).
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BarberMeta',
  description: 'Acompanhamento diário de metas para barbearias',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${dmSerif.variable} ${dmSans.variable} ${inter.variable}`}>
      <body className="font-sans bg-background text-text antialiased min-h-screen">
        <MetaPixel />
        {children}
      </body>
    </html>
  )
}
