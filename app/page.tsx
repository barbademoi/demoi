import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Depoimentos from '@/components/landing/Depoimentos'
import BrindoletaSpotlight from '@/components/landing/BrindoletaSpotlight'
import TudoIncluso from '@/components/landing/TudoIncluso'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'
import CrescimentoReal from '@/components/landing/CrescimentoReal'
import SistemaEmAcao from '@/components/landing/SistemaEmAcao'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberMeta — Engaje sua equipe e venda mais',
  description:
    'Engaje a equipe, acompanhe metas e crie mais oportunidades de venda com sistema completo, aulas, comunidade, suporte e garantia de 30 dias.',
  alternates: {
    canonical: 'https://www.barbermeta.com.br',
  },
  openGraph: {
    title: 'BarberMeta — sua equipe mais engajada e vendendo mais',
    description: 'Metas, ranking, campanhas e Brindoleta para colocar a equipe em movimento, com aulas, suporte e garantia de 30 dias.',
    url: 'https://www.barbermeta.com.br',
    siteName: 'BarberMeta',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/prints/dashboard-meta-coletiva.png', width: 1200, height: 589, alt: 'Dashboard do BarberMeta' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como cada barbeiro acessa o BarberMeta?',
      acceptedAnswer: { '@type': 'Answer', text: 'Cada barbeiro recebe um link único, sem conta e sem senha, para acompanhar os próprios números pelo celular.' },
    },
    {
      '@type': 'Question',
      name: 'Quanto custa a assinatura do BarberMeta?',
      acceptedAnswer: { '@type': 'Answer', text: 'O plano mensal custa R$ 34,90 por mês. O plano anual custa R$ 297 à vista e equivale a R$ 24,75 por mês.' },
    },
    {
      '@type': 'Question',
      name: 'Preciso trocar meu sistema de agendamento?',
      acceptedAnswer: { '@type': 'Answer', text: 'Não. O BarberMeta funciona junto com a agenda que você já usa e ajuda sua equipe a acompanhar metas e vender mais.' },
    },
    {
      '@type': 'Question',
      name: 'Como funciona a garantia do BarberMeta?',
      acceptedAnswer: { '@type': 'Answer', text: 'O pagamento é feito no momento da assinatura. Você pode usar o BarberMeta por 30 dias e, se não gostar, solicitar o cancelamento dentro do prazo para receber 100% do valor pago.' },
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07111F]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main>
        <Hero />
        <SistemaEmAcao />
        <Depoimentos />
        <CrescimentoReal />
        <BrindoletaSpotlight />
        <TudoIncluso />
        <Preco />
        <FAQ />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
