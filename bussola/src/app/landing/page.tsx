import Link from 'next/link'
import { PhoneFrame } from '@/components/landing/PhoneFrame'

export const metadata = {
  title: 'Bússola — Reuniões com clareza',
  description: 'Mentor de reuniões semanais com IA pra empresas pequenas e médias.',
}

// Placeholder pra slot de mídia. Vira PhoneFrame + LazyAutoplayVideo
// (ou <Image>) conforme as mídias forem aplicadas.
function MediaSlot({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <PhoneFrame size={size}>
      <div className="w-full h-full flex items-center justify-center bg-linho text-center p-4">
        <p className="text-xs text-chumbo italic">[ {label} ]</p>
      </div>
    </PhoneFrame>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO */}
      <section className="px-4 pt-16 pb-12 max-w-5xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="font-serif text-4xl sm:text-5xl text-preto leading-tight">
            Reuniões com clareza, semana após semana.
          </h1>
          <p className="text-grafite text-lg max-w-xl mx-auto">
            O mentor com IA que organiza suas observações, conduz a reunião
            semanal e ajuda sua equipe a evoluir.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/cadastro" className="btn-primary">Começar grátis</Link>
            <Link href="/entrar" className="btn-secondary">Entrar</Link>
          </div>
        </div>

        <div className="pt-4">
          <MediaSlot label="VÍDEO HERO — visão geral do app" size="lg" />
        </div>
      </section>

      {/* DIFERENCIAL — Modo Reunião */}
      <section className="relative px-4 py-16 bg-surface border-y border-border overflow-hidden">
        {/* Marca d'água: símbolo grande no fundo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo-simbolo-transparente.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 w-[640px] h-[640px] opacity-[0.06] select-none"
        />
        <div className="relative max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-marrom font-semibold">Diferencial</p>
            <h2 className="font-serif text-3xl text-preto">Modo Reunião conduzido pela IA</h2>
            <p className="text-grafite">
              Seis momentos estruturados — Abertura, Revisão, Reconhecimento,
              Equipe, Ajustes, Encerramento — com dicas em tempo real pra cada
              caso. Você fala, a Bússola lembra.
            </p>
          </div>
          <div>
            <MediaSlot label="VÍDEO MODO REUNIÃO" size="md" />
          </div>
        </div>
      </section>

      {/* BENTO GRID — recursos */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <p className="text-xs uppercase tracking-wider text-marrom font-semibold">O que tem dentro</p>
          <h2 className="font-serif text-3xl text-preto">Tudo o que sua reunião precisa</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-5 space-y-3">
            <MediaSlot label="Observações" size="sm" />
            <h3 className="font-semibold text-text">Observações ao longo da semana</h3>
            <p className="text-sm text-grafite">Capture qualquer coisa no momento. A IA organiza pra você.</p>
          </div>
          <div className="card p-5 space-y-3">
            <MediaSlot label="Link colaborador" size="sm" />
            <h3 className="font-semibold text-text">Link único pra cada pessoa</h3>
            <p className="text-sm text-grafite">Sua equipe acompanha as anotações sem precisar de cadastro.</p>
          </div>
          <div className="card p-5 space-y-3">
            <MediaSlot label="Feedback de cliente" size="sm" />
            <h3 className="font-semibold text-text">Feedback de clientes com brindes</h3>
            <p className="text-sm text-grafite">Coleta estruturada, sorteio automático, integração com Google.</p>
          </div>
        </div>
      </section>

      {/* CASE DEMÔI */}
      <section className="px-4 py-16 bg-linho/40 border-y border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <MediaSlot label="VÍDEO CASE DEMÔI" size="md" />
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-marrom font-semibold">Em uso</p>
            <h2 className="font-serif text-3xl text-preto">Demôi Barbearia</h2>
            <p className="text-grafite">
              Como uma barbearia em Porto Alegre usa a Bússola pra conduzir as
              reuniões semanais da equipe e acompanhar a voz dos clientes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL — símbolo girando no fundo */}
      <section className="relative px-4 py-20 text-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo-simbolo-transparente.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] opacity-[0.08] select-none animate-spin"
          style={{ animationDuration: '30s' }}
        />
        <div className="relative space-y-5">
          <h2 className="font-serif text-3xl text-preto">Pronto pra começar?</h2>
          <p className="text-grafite max-w-md mx-auto">
            Sem cartão de crédito. Em 5 minutos você conduz sua primeira reunião.
          </p>
          <Link href="/cadastro" className="btn-primary inline-flex">Criar minha conta</Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-chumbo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/logo-simbolo-transparente.svg"
            alt=""
            aria-hidden
            className="w-4 h-4 opacity-70"
          />
          <span>© Bússola · <a href="https://bussolameet.com.br" className="hover:text-marrom">bussolameet.com.br</a></span>
        </div>
      </footer>
    </main>
  )
}
