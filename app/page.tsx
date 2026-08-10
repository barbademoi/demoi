import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Depoimentos from '@/components/landing/Depoimentos'
import BrindoletaSpotlight from '@/components/landing/BrindoletaSpotlight'
import FerramentasCatalogo from '@/components/landing/FerramentasCatalogo'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberMeta — Engaje sua equipe e venda mais',
  description:
    'Uma ferramenta que funciona junto da sua agenda para engajar a equipe, acompanhar metas e criar mais oportunidades de venda.',
  alternates: {
    canonical: 'https://www.barbermeta.com.br',
  },
  openGraph: {
    title: 'BarberMeta — sua equipe mais engajada e vendendo mais',
    description: 'Metas, ranking, campanhas e Brindoleta para colocar a equipe em movimento, sem trocar o sistema de agendamento.',
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
        <BrindoletaSpotlight />
        <FerramentasCatalogo />
        <Depoimentos />
        <Preco />
        <FAQ />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
