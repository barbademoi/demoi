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
import DivisorBarbearia from '@/components/landing/DivisorBarbearia'
import PorQueMiniApp from '@/components/landing/PorQueMiniApp'
import StackValor from '@/components/landing/StackValor'
import SuporteHumano from '@/components/landing/SuporteHumano'
import Comunidade from '@/components/landing/Comunidade'
import Garantia from '@/components/landing/Garantia'
import CTAFinal from '@/components/landing/CTAFinal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberMeta — o MiniApp de performance da sua barbearia',
  description:
    'MiniApp de performance para barbearias: metas, ranking e a Brindoleta, a roleta de vendas no QR Code. Comunidade ativa no WhatsApp e suporte humanizado. 1 ano por R$ 97, pagamento único.',
  alternates: {
    canonical: 'https://www.barbermeta.com.br',
  },
  openGraph: {
    title: 'BarberMeta — o MiniApp de performance da sua barbearia',
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
        {/* A ORDEM É UM FUNIL, e cada seção responde a UMA pergunta que a
            pessoa faz nessa sequência:

            1. o que é isso?            → Hero
            2. vou dar conta?           → PorQueMiniApp  (a objeção nº 1)
            3. o que tem de diferente?  → Brindoleta     (o que ela não viu em outro lugar)
            4. funciona mesmo?          → SistemaEmAcao + CrescimentoReal + Depoimentos
            5. o que eu levo?           → StackValor     (ancoragem)
            6. quanto custa?            → Preço
            7. e se não der certo?      → Garantia
            8. vou ficar sozinho?       → Comunidade + Suporte
            9. ainda tenho dúvida       → FAQ
           10. decide                   → CTA final

            A Brindoleta subiu pra terceira posição de propósito: é o único
            item da página que o dono não encontra em concorrente nenhum, e é o
            que ele consegue imaginar acontecendo na cadeira hoje à tarde. */}
        <Hero />
        <PorQueMiniApp />
        <DivisorBarbearia simbolo="poste" />
        <BrindoletaSpotlight />
        <DivisorBarbearia simbolo="tesoura" />
        <SistemaEmAcao />
        <CrescimentoReal />
        <Depoimentos />
        <DivisorBarbearia simbolo="navalha" />
        <StackValor />
        <Preco />
        <Garantia />
        <DivisorBarbearia simbolo="pente" />
        <Comunidade />
        <SuporteHumano />
        <TudoIncluso />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
