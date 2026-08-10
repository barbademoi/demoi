import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Dor from '@/components/landing/Dor'
import AntesDepois from '@/components/landing/AntesDepois'
import Depoimentos from '@/components/landing/Depoimentos'
import Funcionalidades from '@/components/landing/Funcionalidades'
import BrindoletaSpotlight from '@/components/landing/BrindoletaSpotlight'
import Comunidade from '@/components/landing/Comunidade'
import ProvasSocial from '@/components/landing/ProvasSocial'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import CTAFinal from '@/components/landing/CTAFinal'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberMeta — Gestão, vendas e equipe por R$ 34,90/mês',
  description:
    'BarberMeta completo com metas, ranking, financeiro, Brindoleta, comunidade ativa no WhatsApp e suporte humanizado.',
  alternates: {
    canonical: 'https://www.barbermeta.com.br',
  },
  openGraph: {
    title: 'BarberMeta completo — tudo incluído na assinatura',
    description: 'Metas, vendas, financeiro, Brindoleta, comunidade e suporte a partir de R$ 34,90 por mês.',
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
      name: 'Preciso trocar meu sistema de gestão?',
      acceptedAnswer: { '@type': 'Answer', text: 'Não. Você continua usando o sistema que já usa e coloca no BarberMeta apenas os números necessários para acompanhar as metas.' },
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
        <Dor />
        <AntesDepois />
        <Depoimentos />
        <Funcionalidades />
        <BrindoletaSpotlight />
        <Comunidade />
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
