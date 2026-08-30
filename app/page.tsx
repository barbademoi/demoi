import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Depoimentos from '@/components/landing/Depoimentos'
import BrindoletaSpotlight from '@/components/landing/BrindoletaSpotlight'
import Preco from '@/components/landing/Preco'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'
import MobileStickyCTA from '@/components/landing/MobileStickyCTA'
import CrescimentoReal from '@/components/landing/CrescimentoReal'
import SistemaEmAcao from '@/components/landing/SistemaEmAcao'
import DivisorBarbearia from '@/components/landing/DivisorBarbearia'
import OQueTem from '@/components/landing/OQueTem'
import ApoioProximo from '@/components/landing/ApoioProximo'
import Garantia from '@/components/landing/Garantia'
import CTAFinal from '@/components/landing/CTAFinal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BarberMeta — o MiniApp de performance da sua barbearia',
  description:
    'MiniApp de performance para barbearias. Aulas dentro do app ensinando a montar meta coletiva, individual, de produtos, de serviços extras e de assinaturas — e a acompanhar tudo com organização. 1 ano por R$ 97, pagamento único.',
  alternates: {
    canonical: 'https://www.barbermeta.com.br',
  },
  openGraph: {
    title: 'BarberMeta — o MiniApp de performance da sua barbearia',
    description: 'Barbeiro que sabe onde está fica motivado o mês inteiro. Metas, ranking, financeiro e mais, com aulas dentro do app, comunidade no WhatsApp e suporte humanizado. 1 ano por R$ 97.',
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
        {/* A ORDEM RESPONDE, NESTA SEQUÊNCIA, ÀS PERGUNTAS QUE O DONO FAZ:
            o que é isso e eu vou saber usar → Hero (as aulas respondem cedo)
            funciona pra gente como eu?      → Depoimentos, logo no começo
            como funciona no dia a dia?      → carrossel do MiniApp rodando
            o que exatamente eu levo?        → a lista completa, item por item
            tem prova de resultado?          → o caso real, com números
            tem algo que eu não tenha visto? → Brindoleta
            quanto custa e qual o risco?     → preço + garantia
            e se eu travar?                  → aulas, comunidade e suporte
            ainda tenho dúvida               → FAQ
            decide                           → CTA final

            A página encolheu de 18 blocos pra 11: seções que repetiam o mesmo
            argumento foram fundidas, e argumento repetido não convence duas
            vezes — cansa, e o dono passa rolando pelas duas. */}
        <Hero />
        <Depoimentos />
        <SistemaEmAcao />
        <OQueTem />
        <CrescimentoReal />
        <DivisorBarbearia simbolo="poste" />
        <BrindoletaSpotlight />
        <Preco />
        <Garantia />
        <DivisorBarbearia simbolo="tesoura" />
        <ApoioProximo />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
