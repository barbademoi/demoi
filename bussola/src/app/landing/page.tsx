import { Hero } from '@/components/landing/Hero'
import { DemoVisual } from '@/components/landing/DemoVisual'
import { ProvaSocial } from '@/components/landing/ProvaSocial'
import { Problema } from '@/components/landing/Problema'
import { AntesDepois } from '@/components/landing/AntesDepois'
import { Features } from '@/components/landing/Features'
import { SuaEquipeVeAssim } from '@/components/landing/SuaEquipeVeAssim'
import { CaseDemoi } from '@/components/landing/CaseDemoi'
import { OfertaPreco } from '@/components/landing/OfertaPreco'
import { GarantiaFaq } from '@/components/landing/GarantiaFaq'
import { CtaFinal } from '@/components/landing/CtaFinal'
import { RodapeMarketing } from '@/components/landing/RodapeMarketing'
import { StickyMobileCta } from '@/components/landing/StickyMobileCta'

export const metadata = {
  title: 'Bússola — IA mentora pra construir cultura na sua empresa',
  description:
    'IA mentora pra construir cultura na sua empresa. R$ 97 pelo ano todo + 2 bônus exclusivos (mentoria mensal + suporte WhatsApp). Vagas limitadas aos primeiros 100 clientes.',
  openGraph: {
    title: 'Bússola',
    description:
      'IA mentora pra construir cultura na sua empresa. R$ 97 pelo ano todo + 2 bônus exclusivos.',
    url: 'https://bussolameet.com.br',
    siteName: 'Bússola',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Bússola — IA mentora pra construir cultura',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bússola — IA mentora pra construir cultura',
    description: 'R$ 97 pelo ano todo + 2 bônus exclusivos.',
    images: ['/opengraph-image'],
  },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-preto pb-20 md:pb-0">
      <Hero />
      <DemoVisual />
      <ProvaSocial />
      <Problema />
      <AntesDepois />
      <Features />
      <SuaEquipeVeAssim />
      <CaseDemoi />
      <OfertaPreco />
      <GarantiaFaq />
      <CtaFinal />
      <RodapeMarketing />
      <StickyMobileCta />
    </main>
  )
}
