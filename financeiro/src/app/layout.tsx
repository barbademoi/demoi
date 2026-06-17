import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Controle Financeiro — Caixa, contas e folha da sua barbearia',
    template: '%s | Controle Financeiro',
  },
  description:
    'Caixa, contas a pagar e receber, comissão da equipe e quanto sobra no mês — tudo num lugar só. Pagamento único, sem mensalidade.',
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
    <html lang="pt-BR" className={plex.variable}>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  )
}
