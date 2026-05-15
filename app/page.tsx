import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'

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
    </div>
  )
}
