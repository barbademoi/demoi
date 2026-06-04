import Link from 'next/link'
import { PhoneFrame } from '@/components/landing/PhoneFrame'
import { LazyAutoplayVideo } from '@/components/landing/LazyAutoplayVideo'
import { PreparaReuniaoMock } from '@/components/landing/mocks/PreparaReuniaoMock'
import { FeedbackClienteMock } from '@/components/landing/mocks/FeedbackClienteMock'

export const metadata = {
  title: 'Bússola — Reuniões com clareza',
  description: 'Mentor de reuniões semanais com IA pra empresas pequenas e médias.',
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
          <PhoneFrame size="lg">
            <LazyAutoplayVideo
              src="dashboard-gestor"
              poster="/landing/optimized/dashboard-gestor-poster.jpg"
            />
          </PhoneFrame>
        </div>
      </section>

      {/* DIFERENCIAL — Modo Reunião */}
      <section className="relative px-4 py-16 bg-surface border-y border-border overflow-hidden">
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
            <ul className="text-sm text-grafite space-y-2 pt-2">
              <li className="flex gap-2"><span className="text-marrom">·</span> Princípio escrito pra cada momento</li>
              <li className="flex gap-2"><span className="text-marrom">·</span> Observações classificadas automaticamente</li>
              <li className="flex gap-2"><span className="text-marrom">·</span> Metas registradas e revisadas na semana seguinte</li>
            </ul>
          </div>
          <div>
            <PhoneFrame size="md">
              <LazyAutoplayVideo
                src="modo-reuniao"
                poster="/landing/optimized/modo-reuniao-poster.jpg"
              />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs uppercase tracking-wider text-marrom font-semibold">O que tem dentro</p>
          <h2 className="font-serif text-3xl text-preto">Tudo o que sua reunião precisa</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          <BentoCard
            kicker="Inteligência"
            title="A IA escreve o resumo da sua semana"
            description="Suas observações soltas viram um resumo claro do que aconteceu, com sinais por colaborador e categorias. Sem precisar lembrar de tudo."
          >
            <PhoneFrame size="sm">
              <PreparaReuniaoMock />
            </PhoneFrame>
          </BentoCard>

          <BentoCard
            kicker="Voz pra equipe"
            title="Cada colaborador com seu próprio link"
            description="Sua equipe acompanha as anotações em um link privado, sem precisar baixar nada. Marca como visto e responde quando quiser."
          >
            <PhoneFrame size="sm">
              <LazyAutoplayVideo
                src="colaboradores"
                poster="/landing/optimized/colaboradores-poster.jpg"
              />
            </PhoneFrame>
          </BentoCard>

          <BentoCard
            kicker="Voz do cliente"
            title="Feedback de clientes com sorteio de brindes"
            description="Link público de avaliação, integração com Google Reviews, brindes sorteados automaticamente com código único e validade configurável."
          >
            <PhoneFrame size="sm">
              <FeedbackClienteMock />
            </PhoneFrame>
          </BentoCard>

          <BentoCard
            kicker="Sob medida"
            title="Personalize do seu jeito"
            description="Cadência da reunião (diária, semanal, quinzenal ou mensal), categorias de observação, tom da IA e identidade visual da empresa. Tudo configurável."
          >
            <PhoneFrame size="sm">
              <LazyAutoplayVideo
                src="configuracoes"
                poster="/landing/optimized/configuracoes-poster.jpg"
              />
            </PhoneFrame>
          </BentoCard>
        </div>
      </section>

      {/* CASE DEMÔI */}
      <section className="px-4 py-16 bg-linho/40 border-y border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <PhoneFrame size="md">
              <LazyAutoplayVideo
                src="fachada-demoi"
                poster="/landing/optimized/fachada-demoi-poster.jpg"
              />
            </PhoneFrame>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-marrom font-semibold">Em uso</p>
            <h2 className="font-serif text-3xl text-preto">Demôi Barbearia</h2>
            <p className="text-grafite">
              Uma barbearia em Porto Alegre que usa a Bússola pra conduzir as
              reuniões semanais da equipe, registrar observações no dia a dia e
              transformar a voz dos clientes em melhoria contínua.
            </p>
            <blockquote className="border-l-2 border-marrom pl-4 text-sm text-grafite italic">
              &ldquo;A reunião deixou de ser improviso. Agora cada um sai sabendo
              o que precisa melhorar — e o que tá indo bem.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
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

function BentoCard({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-6 space-y-4 hover:bg-linho/30 transition-colors">
      <div>{children}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-marrom font-semibold">{kicker}</p>
        <h3 className="font-serif text-xl text-preto mt-1">{title}</h3>
        <p className="text-sm text-grafite mt-2 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
