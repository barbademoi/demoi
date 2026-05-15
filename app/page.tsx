import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Dor from '@/components/landing/Dor'
import Solucao from '@/components/landing/Solucao'

export const metadata = {
  title: 'BarberMeta — Metas claras. Equipe motivada. Sem cobrar.',
  description:
    'Sistema de metas para barbearias. Cada barbeiro vê o próprio ranking no celular. Quem está atrás, acelera sozinho. R$ 47 vitalício.',
}

export default function LandingPage() {
  return (
    <div className="bg-[#0A1929] min-h-screen">
      <Navbar />
      <Hero />
      <Dor />
      <Solucao />
    </div>
  )
}
