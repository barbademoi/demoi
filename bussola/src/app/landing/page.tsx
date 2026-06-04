import Link from 'next/link'
import { ShieldCheck, Check } from 'lucide-react'
import { PhoneFrame } from '@/components/landing/PhoneFrame'
import { LazyAutoplayVideo } from '@/components/landing/LazyAutoplayVideo'
import { PreparaReuniaoMock } from '@/components/landing/mocks/PreparaReuniaoMock'

export const metadata = {
  title: 'Bússola — A IA mentora que faz sua reunião acontecer',
  description: 'Mentor de reuniões com IA pra pequenas e médias empresas. Em uso real numa barbearia com 11 pessoas e 1.700 atendimentos por mês.',
}

const HOTMART_URL = '#'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-preto">
      {/* HERO */}
      <section className="px-4 pt-12 pb-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto" />
            <p className="text-xs uppercase tracking-wider text-marrom font-semibold">
              Mentor de reuniões com IA pra pequenas e médias empresas
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-preto leading-[1.1]">
              A IA mentora que faz sua reunião semanal acontecer.
            </h1>
            <p className="text-grafite text-lg leading-relaxed">
              Bússola guia sua reunião do começo ao fim, organiza as observações
              da semana e te ensina a liderar — mesmo quando você nunca teve
              tempo de estudar gestão.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a href={HOTMART_URL} className="btn-primary text-base px-6 py-3">
                Quero garantir minha vaga por R$ 97
              </a>
              <a href="#solucao" className="btn-secondary text-base px-6 py-3">
                Ver como funciona
              </a>
            </div>
            <p className="text-xs text-chumbo leading-relaxed">
              Testada em barbearia real com <strong className="text-text">11 pessoas</strong> e
              {' '}<strong className="text-text">1.700 atendimentos/mês</strong> ·
              <strong className="text-text"> 36 feedbacks</strong> coletados em 1 semana · 100% mobile
            </p>
            <div className="inline-flex items-start gap-2 rounded-md bg-linho border-l-[3px] border-marrom px-3 py-2">
              <p className="text-xs text-marrom font-semibold leading-tight">
                OFERTA DE LANÇAMENTO · primeiros 100 clientes ·{' '}
                <span className="font-bold">R$ 97 pelo ano todo</span>{' '}
                <span className="font-normal text-chumbo">(depois R$ 197)</span>
              </p>
            </div>
          </div>
          <div>
            <PhoneFrame size="lg">
              <PreparaReuniaoMock />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — PROVA SOCIAL */}
      <section className="px-4 py-16 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-preto leading-tight">
              Em uso real numa barbearia com 11 pessoas e 1.700 atendimentos por mês.
            </h2>
            <p className="text-grafite">
              A Bússola não nasceu na sala de uma startup. Nasceu no chão da
              Demôi Barbearia em Cássia/MG, onde 11 barbeiros atendem mais de
              1.700 clientes todo mês.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Stat numero="11" label="pessoas na equipe" />
            <Stat numero="1.700+" label="atendimentos por mês" />
            <Stat numero="5.0★" label="média dos clientes" />
          </div>

          <div className="max-w-2xl mx-auto pt-4">
            <PhoneFrame size="lg">
              <LazyAutoplayVideo
                src="fachada-demoi"
                poster="/landing/optimized/fachada-demoi-poster.jpg"
              />
            </PhoneFrame>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — A DOR */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl text-preto text-center leading-tight">
          Liderar dá um trabalho que ninguém te ensinou.
        </h2>
        <div className="mt-10 space-y-5 text-grafite text-lg leading-relaxed">
          <p>Você sai da reunião sem saber se foi produtiva ou não.</p>
          <p>Cobra alguém e fica em dúvida se foi duro demais — ou se foi mole demais.</p>
          <p>Quer elogiar, mas trava porque parece bajulação.</p>
          <p>Sente que sua equipe poderia render mais, mas não sabe exatamente o que precisa mudar.</p>
          <p>E entre atender cliente, pagar conta e resolver problema, nunca sobra tempo pra ler livro de gestão.</p>
        </div>
        <p className="mt-10 font-serif text-2xl sm:text-3xl text-marrom text-center leading-snug">
          A Bússola foi feita pra resolver tudo isso — sem precisar virar especialista em liderança.
        </p>
      </section>

      {/* SEÇÃO 4 — A SOLUÇÃO EM AÇÃO */}
      <section id="solucao" className="relative px-4 py-16 bg-surface border-y border-border overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo-simbolo-transparente.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 w-[640px] h-[640px] opacity-[0.06] select-none"
        />
        <div className="relative max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="font-serif text-3xl sm:text-4xl text-preto leading-tight">
              A reunião que conduz você.
            </h2>
            <p className="text-grafite text-lg">
              A Bússola transforma observações soltas da semana numa reunião
              estruturada. Você só conduz.
            </p>
            <div className="space-y-4 text-grafite leading-relaxed pt-2">
              <p>
                Durante a semana, você anota qualquer observação sobre sua equipe.
                Texto livre, em segundos, no celular.
              </p>
              <p>
                Na hora da reunião, a IA organiza tudo nos 6 momentos certos:
                <strong className="text-text"> Abertura, Revisão, Reconhecimento,
                Equipe, Ajustes e Encerramento</strong>.
              </p>
              <p>
                Em cada momento, princípios sólidos de liderança aparecem pra te
                orientar. Você fala, a Bússola lembra do que importa.
              </p>
            </div>
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

      {/* SEÇÃO 5 — COMO FUNCIONA (3 PASSOS) */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-preto">
            Três passos. Uma semana melhor.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          <Passo numero="01" titulo="Anote no momento" texto="Viu algo importante? Abre o celular, anota em segundos. Sem categoria, sem complicação." />
          <Passo numero="02" titulo="A IA organiza" texto="No dia da reunião, sua pauta aparece pronta. Cada observação no lugar certo, com sugestão de como abordar." />
          <Passo numero="03" titulo="Você conduz" texto="Segue os 6 momentos da Bússola no celular. Equipe entende, você lidera com clareza, todo mundo sai sabendo o que fazer." />
        </div>
        <p className="text-center text-grafite text-lg mt-12 italic">
          Reunião pronta em 30 minutos. Sem decorar, sem adivinhar.
        </p>
      </section>

      {/* SEÇÃO 6 — CASE DEMÔI EXPANDIDO */}
      <section className="px-4 py-16 bg-linho/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl text-preto">O caso da Demôi Barbearia.</h2>
            <p className="text-grafite">Carlos Henrique conta como a Bússola virou rotina no negócio dele.</p>
          </div>

          <div className="grid lg:grid-cols-[260px_1fr] gap-10 items-start">
            <div className="text-center lg:text-left">
              <div className="w-32 h-32 mx-auto lg:mx-0 rounded-full bg-linho border-2 border-marrom flex items-center justify-center font-serif text-4xl text-marrom mb-3">
                CH
              </div>
              <p className="font-semibold text-text">Carlos Henrique</p>
              <p className="text-sm text-chumbo">Fundador da Bússola</p>
              <p className="text-xs text-chumbo">Dono da Demôi Barbearia · Cássia/MG</p>
            </div>

            <div className="space-y-5 text-grafite leading-relaxed">
              <p>
                Meu negócio cresceu, a equipe foi de 4 pra 11 pessoas, e a reunião
                semanal virou um problema. Era improvisada, cada um saía com a
                sensação diferente do que tinha sido falado, e eu mesmo não tinha
                clareza do que cobrar.
              </p>
              <p>
                Comecei a desenhar a Bússola pra mim. Anotava observações no
                celular durante a semana, e a IA me montava a pauta pronta. Em
                pouco tempo, vi mudanças concretas:
              </p>
              <p>
                Os atendimentos passaram a ter mais consistência. Hoje a Demôi faz
                mais de <strong className="text-text">1.700 atendimentos por mês</strong>,
                e a média de avaliação dos clientes é{' '}
                <strong className="text-text">5.0 estrelas</strong>. Em uma semana,
                recebemos <strong className="text-text">36 feedbacks</strong> positivos.
              </p>
              <p>
                Não foi a Bússola que fez isso sozinha. Foi a cultura que ela me
                ajudou a construir, semana após semana, na conversa com a equipe.
              </p>

              <blockquote className="mt-6 border-l-4 border-marrom bg-linho/80 p-5 rounded-r-md italic text-grafite">
                <p>
                  &ldquo;Semana de puro fogo! Zé Lucas é destaque absoluto com seis
                  feedbacks cinco estrelas elogiando atendimento rápido e excelente,
                  enquanto Rael bomba com paciência e carisma reconhecidos pelos
                  clientes.&rdquo;
                </p>
                <footer className="not-italic text-xs text-chumbo mt-3">
                  — Resumo da semana gerado pela IA da Bússola
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 7 — OFERTA E PREÇO */}
      <section id="oferta" className="px-4 py-20 max-w-2xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="font-serif text-3xl sm:text-4xl text-preto">Acesso completo por 1 ano.</h2>
          <p className="text-grafite">Pagamento único. Sem mensalidade. Sem cartão recorrente.</p>
        </div>

        <div className="rounded-xl border-2 border-marrom bg-surface shadow-lg p-6 sm:p-8 space-y-5">
          <div className="inline-flex items-center gap-1.5 bg-linho text-marrom text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
            Oferta de lançamento · 100 primeiros clientes
          </div>
          <div className="space-y-1">
            <p className="text-grafite line-through text-base">De R$ 197/ano</p>
            <p className="font-serif text-5xl sm:text-6xl text-marrom font-bold leading-none">R$ 97</p>
            <p className="text-chumbo text-sm">por 12 meses de acesso</p>
          </div>

          <ul className="space-y-2.5 pt-2">
            {[
              'Reuniões guiadas pela IA, sem limite',
              'Modo Reunião com 6 momentos estruturados',
              'Resumo automático da semana',
              'Equipe sem limite de pessoas',
              'Feedback de clientes com brindes',
              'Integração com Google Reviews',
              'Tutoriais embutidos',
              'Acesso pelo celular (PWA)',
              'Suporte por WhatsApp',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text">
                <Check size={16} strokeWidth={2.2} className="text-verde-musgo mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a href={HOTMART_URL} className="btn-primary w-full justify-center text-base py-4">
            Quero garantir minha vaga por R$ 97
          </a>
          <p className="text-xs text-chumbo text-center">
            Pagamento pelo Hotmart · 7 dias de garantia incondicional
          </p>
        </div>

        <p className="text-center text-sm text-chumbo mt-6">
          Após os primeiros 100, o valor passa a ser R$ 197/ano.
        </p>
      </section>

      {/* SEÇÃO 8 — GARANTIA + FAQ */}
      <section className="px-4 py-16 bg-surface border-y border-border">
        <div className="max-w-3xl mx-auto space-y-16">
          {/* GARANTIA */}
          <div className="text-center space-y-4">
            <ShieldCheck size={56} strokeWidth={1.5} className="mx-auto text-verde-musgo" />
            <h2 className="font-serif text-3xl sm:text-4xl text-preto">7 dias pra decidir.</h2>
            <p className="text-grafite max-w-xl mx-auto leading-relaxed">
              Não gostou? Devolvemos seu dinheiro integralmente, sem pergunta.
              Em até 7 dias após a compra, basta enviar uma mensagem solicitando
              reembolso. Nosso compromisso é com o seu resultado, não com sua
              assinatura.
            </p>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl text-preto text-center mb-8">
              Perguntas que você provavelmente tem.
            </h3>
            <div className="space-y-2">
              {FAQ.map((item) => (
                <details
                  key={item.p}
                  className="group rounded-md border border-border bg-background open:bg-linho/40"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 font-medium text-text text-sm sm:text-base">
                    <span>{item.p}</span>
                    <span className="text-marrom text-xl transition-transform group-open:rotate-45 select-none">+</span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-grafite leading-relaxed">
                    {item.r}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 9 — CTA FINAL */}
      <section className="relative px-4 py-20 bg-preto text-white overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo-simbolo-transparente.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] opacity-[0.08] select-none animate-spin"
          style={{ animationDuration: '30s' }}
        />
        <div className="relative max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-5xl leading-tight">
            Sua próxima reunião pode ser diferente.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Junte-se aos primeiros 100 que vão receber acesso completo à
            Bússola por R$ 97 pelo ano todo.
          </p>
          <a
            href={HOTMART_URL}
            className="inline-flex items-center justify-center bg-areia text-preto font-semibold px-8 py-4 rounded-md hover:bg-linho transition-colors text-base"
          >
            Garantir minha vaga por R$ 97
          </a>
          <p className="text-xs text-white/60">
            7 dias de garantia · Pagamento pelo Hotmart · Vagas limitadas
          </p>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="px-4 py-12 bg-background">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-completa.svg" alt="Bússola" className="h-8 w-auto" />
            <p className="text-sm text-chumbo italic">A bússola que faltava na sua liderança.</p>
          </div>
          <div className="space-y-2 text-sm text-grafite">
            <p className="font-semibold text-text mb-2">Links</p>
            <p><Link href="/termos" className="hover:text-marrom">Termos de uso</Link></p>
            <p><Link href="/privacidade" className="hover:text-marrom">Política de privacidade</Link></p>
            <p><a href="mailto:contato@bussolameet.com.br" className="hover:text-marrom">Contato</a></p>
          </div>
          <div className="text-sm text-grafite">
            <p className="font-semibold text-text mb-2">Sobre</p>
            <p>A Bússola é uma ferramenta de gestão criada por Carlos Henrique, fundador da Demôi Barbearia em Cássia/MG.</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-8 mt-8 border-t border-border text-center text-xs text-chumbo">
          © 2026 Bússola · <a href="https://bussolameet.com.br" className="hover:text-marrom">bussolameet.com.br</a>
        </div>
      </footer>
    </main>
  )
}

function Stat({ numero, label }: { numero: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-3xl sm:text-5xl text-marrom font-bold leading-none">{numero}</p>
      <p className="text-xs sm:text-sm text-chumbo mt-1.5">{label}</p>
    </div>
  )
}

function Passo({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="space-y-3">
      <p className="font-serif text-5xl text-marrom font-bold leading-none">{numero}</p>
      <h3 className="font-semibold text-text text-lg">{titulo}</h3>
      <p className="text-sm text-grafite leading-relaxed">{texto}</p>
    </div>
  )
}

const FAQ = [
  {
    p: 'Funciona pra qualquer tipo de empresa?',
    r: 'Sim. A Bússola foi desenhada universal — qualquer empresa com equipe. Barbearia, salão, restaurante, loja, oficina, escritório, clínica, agência. A linguagem é neutra, sem termos específicos de setor.',
  },
  {
    p: 'Quantas pessoas cabem na minha conta?',
    r: 'Sem limite. Cadastre quantas pessoas quiser na equipe — o preço é o mesmo. A Bússola funciona bem de 3 a 30 pessoas.',
  },
  {
    p: 'Preciso ensinar minha equipe a usar?',
    r: 'Não. Sua equipe acessa um link único pelo celular, sem app, sem login. Em 30 segundos entendem.',
  },
  {
    p: 'E se eu nunca conduzi reunião antes?',
    r: 'A Bússola foi feita pra isso. Cada momento da reunião vem com instrução, princípio de liderança e sugestão de fala. Você não decora — só conduz.',
  },
  {
    p: 'Funciona no celular?',
    r: 'Sim, totalmente. A Bússola é mobile-first. 99% do uso é pelo celular, pra você e pra equipe.',
  },
  {
    p: 'O pagamento é mensal ou anual?',
    r: 'Anual. Você paga R$ 97 uma vez e tem acesso por 12 meses. Sem cartão recorrente, sem cobrança mensal.',
  },
  {
    p: 'E depois dos 100 primeiros, o preço sobe?',
    r: 'Sim. A oferta de R$ 97 é só para os primeiros 100. Depois disso, o valor passa a R$ 197/ano. Quem comprar agora, mantém R$ 97 na próxima renovação.',
  },
  {
    p: 'Posso testar antes?',
    r: 'Não temos versão grátis, mas oferecemos 7 dias de garantia integral. Compra, testa, e se não gostar, devolvemos seu dinheiro.',
  },
]
