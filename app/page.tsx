import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import PlatformStats from '@/components/landing/PlatformStats'
import Dor from '@/components/landing/Dor'
import AntesDepois from '@/components/landing/AntesDepois'
import Funcionalidades from '@/components/landing/Funcionalidades'
import Comparacao from '@/components/landing/Comparacao'
import VideoAulas from '@/components/landing/VideoAulas'
import ProvasSocial from '@/components/landing/ProvasSocial'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import CTAFinal from '@/components/landing/CTAFinal'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'
import { getPlatformStats } from '@/lib/stats'

export const metadata = {
  title: 'BarberMeta — Metas claras. Equipe motivada. Sem cobrar.',
  description:
    'Sistema de metas para barbearias. Cada barbeiro vê o próprio ranking no celular. Quem está atrás, acelera sozinho. R$ 47 vitalício.',
}

// Tempo real: stats são buscados a cada request
export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const stats = await getPlatformStats()

  return (
    <div className="bg-[#0A1929] min-h-screen">
      <Navbar />
      <Hero />
      <PlatformStats barbearias={stats.barbearias} barbeiros={stats.barbeiros} />
      <AntesDepois />
      <Dor />
      <Funcionalidades />
      <Comparacao />
      <VideoAulas />
      <ProvasSocial />
      <Preco />
      <FAQ />
      <CTAFinal />
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
