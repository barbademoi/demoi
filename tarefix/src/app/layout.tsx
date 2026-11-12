import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ScriptTema } from '@/components/ScriptTema'
import './globals.css'

const fonte = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--fonte',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tarefix',
  description: 'Checklist diário de tarefas da equipe.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F3F8' },
    { media: '(prefers-color-scheme: dark)', color: '#14121F' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fonte.variable} suppressHydrationWarning>
      <head>
        <ScriptTema />
      </head>
      <body className="min-h-dvh font-sans font-medium antialiased">{children}</body>
    </html>
  )
}
