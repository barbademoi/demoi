import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Dor from '@/components/landing/Dor'
import AntesDepois from '@/components/landing/AntesDepois'
import Solucao from '@/components/landing/Solucao'
import TudoQueFaz from '@/components/landing/TudoQueFaz'
import Depoimentos from '@/components/landing/Depoimentos'
import Funcionalidades from '@/components/landing/Funcionalidades'
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
    <div className="min-h-screen bg-[#0A1929]">
      <Navbar />
      <main>
        <Hero />
        <Dor />
        <AntesDepois />
        <Solucao />
        <TudoQueFaz />
        <Depoimentos />
        <Funcionalidades />
        <ProvasSocial />
        <Preco />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
sed: --: No such file or directory
