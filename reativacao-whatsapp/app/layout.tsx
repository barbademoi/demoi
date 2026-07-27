import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reativação WhatsApp — Barbearia',
  description: 'Ferramenta pessoal pra reativar clientes via WhatsApp (envio semi-manual).',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
