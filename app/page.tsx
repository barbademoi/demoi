import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Dor from '@/components/landing/Dor'
import Funcionalidades from '@/components/landing/Funcionalidades'
import VideoAulas from '@/components/landing/VideoAulas'
import ProvasSocial from '@/components/landing/ProvasSocial'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import CTAFinal from '@/components/landing/CTAFinal'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'

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
      <Funcionalidades />
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
