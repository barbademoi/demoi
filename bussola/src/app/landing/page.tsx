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

// Metadata vive no root layout (src/app/layout.tsx) porque a landing também
// é servida em / (via src/app/page.tsx), não só em /landing.

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
