import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { ScriptTema } from '@/components/tarefix/ScriptTema'
import './tarefix.css'

// Tarefix: produto separado que roda dentro do site do BarberMeta.
// Tudo fica sob o wrapper .tarefix (fonte, cores e tema próprios).
//
// Plus Jakarta Sans hospedada aqui (OFL, ver fontes/LICENSE-OFL.txt), e não
// via next/font/google: o Google às vezes responde a URL do arquivo sem
// extensão e o build do Next quebra — o que derrubaria o deploy do BarberMeta.
const fonte = localFont({
  src: [
    { path: './fontes/plus-jakarta-sans-500.woff2', weight: '500', style: 'normal' },
    { path: './fontes/plus-jakarta-sans-700.woff2', weight: '700', style: 'normal' },
    { path: './fontes/plus-jakarta-sans-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--tf-fonte',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: { default: 'Tarefix', template: '%s · Tarefix' },
  description: 'Checklist diário de tarefas da equipe.',
  robots: { index: false, follow: false },
}

export default function TarefixLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tarefix ${fonte.variable} antialiased`}>
      <ScriptTema />
      {children}
    </div>
  )
}
