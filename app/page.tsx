import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import TudoQueFaz from '@/components/landing/TudoQueFaz'
import AntesDepois from '@/components/landing/AntesDepois'
import ParaQuem from '@/components/landing/ParaQuem'
import Funcionalidades from '@/components/landing/Funcionalidades'
import VideoAulas from '@/components/landing/VideoAulas'
import ProvasSocial from '@/components/landing/ProvasSocial'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import CTAFinal from '@/components/landing/CTAFinal'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'

export const metadata = {
  title: 'BarberMeta — O sistema que transforma sua barbearia numa gincana de vendas',
  description:
    'Crie a gincana de vendas da sua barbearia: cada barbeiro vê comissão, ranking e metas no celular. Quem está atrás, acelera sozinho. R$ 47 vitalício.',
}

export default function LandingPage() {
  return (
    <div className="bg-[#0A1929] min-h-screen">
      <Navbar />
      <Hero />
      <TudoQueFaz />
      <AntesDepois />
      <ParaQuem />
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
