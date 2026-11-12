import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ScriptTema } from '@/components/tarefix/ScriptTema'
import './tarefix.css'

// Tarefix: produto separado que roda dentro do site do BarberMeta.
// Tudo fica sob o wrapper .tarefix (fonte, cores e tema próprios).
const fonte = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--tf-fonte',
  display: 'swap',
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
