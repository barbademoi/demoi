import { Hero } from '@/components/landing/Hero'
import { DemoVisual } from '@/components/landing/DemoVisual'
import { ProvaSocial } from '@/components/landing/ProvaSocial'
import { Features } from '@/components/landing/Features'
import { Cultura } from '@/components/landing/Cultura'
import { CaseDemoi } from '@/components/landing/CaseDemoi'
import { OfertaPreco } from '@/components/landing/OfertaPreco'
import { GarantiaFaq } from '@/components/landing/GarantiaFaq'
import { CtaFinal } from '@/components/landing/CtaFinal'
import { RodapeMarketing } from '@/components/landing/RodapeMarketing'
import { StickyMobileCta } from '@/components/landing/StickyMobileCta'

export const metadata = {
  title: 'Bússola — IA mentora que constrói cultura na sua empresa',
  description:
    'IA mentora que constrói cultura na sua empresa. Bússola guia sua reunião semanal com fundamentos consagrados da gestão. R$ 97 pelo ano todo, vagas limitadas aos primeiros 100 clientes.',
  openGraph: {
    title: 'Bússola',
    description: 'A IA mentora que constrói cultura na sua empresa.',
    url: 'https://bussolameet.com.br',
    siteName: 'Bússola',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Bússola — IA mentora pra construir cultura',
      },
    ],
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-preto pb-20 md:pb-0">
      <Hero />
      <DemoVisual />
      <ProvaSocial />
      <Features />
      <Cultura />
      <CaseDemoi />
      <OfertaPreco />
      <GarantiaFaq />
      <CtaFinal />
      <RodapeMarketing />
      <StickyMobileCta />
    </main>
  )
}
