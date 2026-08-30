import Navbar from '@/components/landing/Navbar'
import VideoTopo from '@/components/landing/VideoTopo'
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
import DivisorBarbearia from '@/components/landing/DivisorBarbearia'
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
    description: 'Acesso completo por 1 ano por R$ 97, pagamento único: metas, ranking, Brindoleta, Financeiro e Feedback Premiado, com aulas, suporte e garantia de 30 dias.',
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
      name: 'Quanto custa o BarberMeta?',
      acceptedAnswer: { '@type': 'Answer', text: 'R$ 97 em pagamento único, dando 1 ano de acesso completo a todos os módulos. Não é mensalidade e não há renovação automática.' },
    },
    {
      '@type': 'Question',
      name: 'Preciso trocar meu sistema de agendamento?',
      acceptedAnswer: { '@type': 'Answer', text: 'Não. O BarberMeta funciona junto com a agenda que você já usa e ajuda sua equipe a acompanhar metas e vender mais.' },
    },
    {
      '@type': 'Question',
      name: 'Como funciona a garantia do BarberMeta?',
      acceptedAnswer: { '@type': 'Answer', text: 'O pagamento é feito uma vez só, na compra. Você pode usar o BarberMeta por 30 dias e, se não gostar, solicitar o reembolso dentro do prazo para receber 100% do valor pago.' },
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-carvao">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main>
        {/* VÍDEO ANTES DO HERO: mostrar o sistema rodando convence mais rápido
            do que qualquer headline. Fica embutido e sempre visível — nunca em
            modal — e o hero continua logo abaixo, sem rolagem longa. */}
        <VideoTopo />
        <Hero />
        <SistemaEmAcao />
        {/* PREÇO logo depois do carrossel: quem se convenceu vendo o sistema
            não deveria ter que atravessar quatro seções pra achar o valor. O
            que vem abaixo continua existindo como reforço pra quem ainda está
            em dúvida. */}
        <Preco />
        <DivisorBarbearia simbolo="tesoura" />
        <Depoimentos />
        <CrescimentoReal />
        <DivisorBarbearia simbolo="poste" />
        <BrindoletaSpotlight />
        <DivisorBarbearia simbolo="navalha" />
        <TudoIncluso />
        <DivisorBarbearia simbolo="pente" />
        <FAQ />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
