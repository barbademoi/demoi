import { Hero } from '@/components/landing/Hero'
import { ProvaSocial } from '@/components/landing/ProvaSocial'
import { TeseCentral } from '@/components/landing/TeseCentral'
import { Dor } from '@/components/landing/Dor'
import { SolucaoEmAcao } from '@/components/landing/SolucaoEmAcao'
import { ComoFunciona } from '@/components/landing/ComoFunciona'
import { CaseDemoi } from '@/components/landing/CaseDemoi'
import { OfertaPreco } from '@/components/landing/OfertaPreco'
import { GarantiaFaq } from '@/components/landing/GarantiaFaq'
import { CtaFinal } from '@/components/landing/CtaFinal'
import { RodapeMarketing } from '@/components/landing/RodapeMarketing'
import { StickyMobileCta } from '@/components/landing/StickyMobileCta'

export const metadata = {
  title: 'Bússola — A ferramenta que constrói cultura na sua empresa',
  description:
    'Empresa só cresce se a cultura for forte. A Bússola é o mentor com IA que te ajuda a construir cultura semana após semana — na conversa com sua equipe. R$ 97 pelo ano todo, vagas limitadas aos primeiros 100 clientes.',
  openGraph: {
    title: 'Bússola — Empresa só cresce se a cultura for forte',
    description:
      'O mentor com IA que constrói cultura na sua reunião semanal. R$ 97 pelo ano todo (primeiros 100 clientes).',
    url: 'https://bussolameet.com.br',
    siteName: 'Bússola',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-preto pb-20 md:pb-0">
      <Hero />
      <ProvaSocial />
      <TeseCentral />
      <Dor />
      <SolucaoEmAcao />
      <ComoFunciona />
      <CaseDemoi />
      <OfertaPreco />
      <GarantiaFaq />
      <CtaFinal />
      <RodapeMarketing />
      <StickyMobileCta />
    </main>
  )
}
