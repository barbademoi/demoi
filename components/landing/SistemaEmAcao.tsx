'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type Grupo = 'Metas' | 'Campanhas' | 'Feedback' | 'Brindoleta' | 'Financeiro' | 'Equipe' | 'Reuniões'

type Slide = {
  grupo: Grupo
  passo: string
  titulo: string
  descricao: string
  ganho: string
  imagem: string
  alt: string
  cor: string
}

const slides: Slide[] = [
  {
    grupo: 'Metas',
    passo: 'Passo 1 de 3',
    titulo: 'Defina metas e prêmios que a equipe entende.',
    descricao: 'Crie objetivos coletivos e individuais em níveis Bronze, Prata e Ouro. Cada conquista pode ter uma recompensa clara para manter o time motivado até o fim do mês.',
    ganho: 'Você transforma um número distante em etapas que dão vontade de alcançar.',
    imagem: '/prints/carrossel-sistema/01-configure-metas.jpg',
    alt: 'Configuração de metas coletivas e individuais com níveis e prêmios no BarberMeta',
    cor: '#F2B84B',
  },
  {
    grupo: 'Metas',
    passo: 'Passo 2 de 3',
    titulo: 'Saiba todos os dias se a barbearia está no ritmo.',
    descricao: 'O painel mostra quanto a equipe já faturou, quanto falta e qual precisa ser o resultado por dia de trabalho para chegar à meta.',
    ganho: 'Você corrige a rota durante o mês, em vez de descobrir o problema quando já é tarde.',
    imagem: '/prints/carrossel-sistema/02-meta-coletiva.jpg',
    alt: 'Painel de meta coletiva com faturamento, progresso e ritmo diário',
    cor: '#FFD84D',
  },
  {
    grupo: 'Metas',
    passo: 'Passo 3 de 3',
    titulo: 'Mostre a evolução e coloque a equipe em movimento.',
    descricao: 'Cada profissional acompanha sua comissão, sua posição e o avanço nos níveis da meta. O objetivo deixa de ficar só na cabeça do dono.',
    ganho: 'A equipe enxerga o próximo passo e passa a participar do resultado.',
    imagem: '/prints/carrossel-sistema/03-ranking-comissao.jpg',
    alt: 'Ranking de barbeiros por comissão e progresso nas metas',
    cor: '#D8FF00',
  },
  {
    grupo: 'Campanhas',
    passo: 'Passo 1 de 4',
    titulo: 'Escolha exatamente o que você quer vender mais.',
    descricao: 'Cadastre produtos, serviços extras, assinaturas e outras ações. Depois, defina quantos pontos cada venda ou atividade vale.',
    ganho: 'Você direciona o esforço da equipe para o que mais ajuda o caixa da barbearia.',
    imagem: '/prints/carrossel-sistema/04-campanha-servicos.jpg',
    alt: 'Configuração dos serviços e pontos de uma campanha no BarberMeta',
    cor: '#2F6DF6',
  },
  {
    grupo: 'Campanhas',
    passo: 'Passo 2 de 4',
    titulo: 'Premie o ranking sem perder o controle do orçamento.',
    descricao: 'Defina quanto cada posição recebe e ajuste a premiação de acordo com a realidade da sua barbearia.',
    ganho: 'A disputa fica saudável, transparente e financeiramente planejada.',
    imagem: '/prints/carrossel-sistema/05-campanha-premios.jpg',
    alt: 'Configuração de prêmios por posição no ranking da campanha',
    cor: '#9B6CFF',
  },
  {
    grupo: 'Campanhas',
    passo: 'Passo 3 de 4',
    titulo: 'A equipe vê quem se classificou e o que ainda falta.',
    descricao: 'O ranking separa os profissionais qualificados de quem ainda busca a pontuação mínima e avisa quando alguém está sem lançamento no dia.',
    ganho: 'Ninguém precisa esperar o fechamento do mês para saber como está indo.',
    imagem: '/prints/carrossel-sistema/06-ranking-pontos.jpg',
    alt: 'Ranking de pontos com profissionais qualificados e alertas de lançamento',
    cor: '#FF9B42',
  },
  {
    grupo: 'Campanhas',
    passo: 'Passo 4 de 4',
    titulo: 'Confira de onde veio cada ponto da campanha.',
    descricao: 'O relatório reúne as atividades, quantidades, pontos por unidade e o total conquistado pela equipe no período.',
    ganho: 'Você premia com segurança e identifica quais ações realmente aconteceram.',
    imagem: '/prints/carrossel-sistema/07-conferencia-pontos.jpg',
    alt: 'Relatório de conferência dos pontos da equipe por atividade',
    cor: '#36BFFA',
  },
  {
    grupo: 'Feedback',
    passo: 'Visão completa',
    titulo: 'Transforme a opinião do cliente em reconhecimento e melhoria.',
    descricao: 'Veja avaliações, comentários, o profissional responsável e o benefício sorteado. Tudo fica organizado para acompanhar e responder com mais atenção.',
    ganho: 'Você reconhece quem atende bem e encontra oportunidades reais de melhorar a experiência.',
    imagem: '/prints/carrossel-sistema/08-feedback-clientes.jpg',
    alt: 'Painel de avaliações dos clientes com comentários e brindes sorteados',
    cor: '#FFD84D',
  },
  {
    grupo: 'Brindoleta',
    passo: 'Passo 1 de 3',
    titulo: 'O QR Code transforma o atendimento em oportunidade de venda.',
    descricao: 'Cada profissional recebe seu próprio QR Code. O cliente aponta o celular, abre a Brindoleta e gira para descobrir uma condição preparada pela barbearia.',
    ganho: 'A oferta chega de um jeito leve, divertido e sem criar uma abordagem desconfortável.',
    imagem: '/prints/carrossel-sistema/09-brindoleta-roleta.jpg',
    alt: 'Brindoleta aberta no celular do cliente com ofertas na roleta',
    cor: '#D8FF00',
  },
  {
    grupo: 'Brindoleta',
    passo: 'Passo 2 de 3',
    titulo: 'O cliente vê a oferta e decide se quer aproveitar.',
    descricao: 'Quando a roleta para, o benefício aparece de forma clara com um botão para aceitar. A condição pode incentivar a compra de um produto ou serviço extra.',
    ganho: 'Você cria urgência e desejo sem depender de descontos iguais para todo mundo.',
    imagem: '/prints/carrossel-sistema/10-brindoleta-oferta.jpg',
    alt: 'Oferta de desconto revelada ao cliente depois do giro da Brindoleta',
    cor: '#FF5F45',
  },
  {
    grupo: 'Brindoleta',
    passo: 'Passo 3 de 3',
    titulo: 'Descubra quem está transformando giros em vendas.',
    descricao: 'O painel mostra giros, ofertas aceitas, conversão e vendas confirmadas por colaborador. O dono valida o que realmente foi vendido.',
    ganho: 'Você mede o retorno da ação e reconhece quem mais gera novas oportunidades.',
    imagem: '/prints/carrossel-sistema/11-brindoleta-resultados.jpg',
    alt: 'Painel de resultados da Brindoleta por colaborador',
    cor: '#D8FF00',
  },
  {
    grupo: 'Financeiro',
    passo: 'Visão geral',
    titulo: 'Veja o que entrou, o que vai sair e quanto sobra no caixa.',
    descricao: 'Organize contas a pagar e a receber, folha da equipe, caixa da empresa e finanças pessoais em áreas separadas ou em uma visão completa.',
    ganho: 'Você toma decisões com os números à vista, sem depender de contas espalhadas.',
    imagem: '/prints/carrossel-sistema/12-controle-financeiro.jpg',
    alt: 'Visão geral do controle financeiro do BarberMeta',
    cor: '#E0B765',
  },
  {
    grupo: 'Equipe',
    passo: 'Gestão privada',
    titulo: 'Alinhe comportamentos sem misturar tudo com as vendas.',
    descricao: 'Cadastre regras de conduta e registre ocorrências positivas ou negativas em uma trilha privada que somente o dono vê.',
    ganho: 'Você conduz conversas difíceis com histórico e clareza, sem expor o profissional.',
    imagem: '/prints/carrossel-sistema/13-comportamento-equipe.jpg',
    alt: 'Configuração privada de metas de comportamento da equipe',
    cor: '#2F6DF6',
  },
  {
    grupo: 'Reuniões',
    passo: 'Passo 1 de 5',
    titulo: 'Comece a reunião com os números reais da barbearia.',
    descricao: 'O BarberMeta compara o faturamento mês a mês e o período atual com os mesmos dias do mês anterior.',
    ganho: 'A conversa sai do achismo e começa pelo que realmente está acontecendo.',
    imagem: '/prints/carrossel-sistema/14-reuniao-faturamento.jpg',
    alt: 'Raio-x do faturamento geral para reunião de equipe',
    cor: '#32D583',
  },
  {
    grupo: 'Reuniões',
    passo: 'Passo 2 de 5',
    titulo: 'Descubra quem precisa de atenção antes do mês acabar.',
    descricao: 'A projeção mostra o ritmo da equipe e destaca quem está abaixo do período anterior ou atrasado em relação à própria meta.',
    ganho: 'Você age enquanto ainda existe tempo para recuperar o resultado.',
    imagem: '/prints/carrossel-sistema/15-reuniao-atencao.jpg',
    alt: 'Panorama da equipe com projeção e profissionais que precisam de atenção',
    cor: '#FFB547',
  },
  {
    grupo: 'Reuniões',
    passo: 'Passo 3 de 5',
    titulo: 'Conduza uma conversa justa com cada profissional.',
    descricao: 'Compare comissão, evolução em relação ao mês anterior, pontos e alertas de cada barbeiro em uma mesma visão.',
    ganho: 'O feedback individual fica objetivo e baseado em fatos, não em impressão.',
    imagem: '/prints/carrossel-sistema/16-reuniao-por-barbeiro.jpg',
    alt: 'Comparativo por barbeiro com comissão, evolução e pontos',
    cor: '#36BFFA',
  },
  {
    grupo: 'Reuniões',
    passo: 'Passo 4 de 5',
    titulo: 'Reconheça as vitórias que merecem ser celebradas.',
    descricao: 'Veja quem teve maior pontuação, maior comissão e maior evolução para destacar bons exemplos diante da equipe.',
    ganho: 'O reconhecimento reforça os comportamentos que você quer ver se repetir.',
    imagem: '/prints/carrossel-sistema/17-reuniao-destaques.jpg',
    alt: 'Destaques do mês com maior pontuação, comissão e evolução',
    cor: '#C47A2C',
  },
  {
    grupo: 'Reuniões',
    passo: 'Passo 5 de 5',
    titulo: 'Chegue à reunião com uma pauta criada por IA.',
    descricao: 'A inteligência artificial analisa os números reais e organiza um resumo com pontos de atenção. Depois, você pode copiar ou enviar pelo WhatsApp.',
    ganho: 'Você economiza tempo e conduz uma reunião mais objetiva, preparada e produtiva.',
    imagem: '/prints/carrossel-sistema/18-reuniao-ia.jpg',
    alt: 'Pauta de reunião criada por inteligência artificial com base nos dados reais',
    cor: '#2F6DF6',
  },
]

const capitulos: { nome: Grupo; indice: number }[] = [
  { nome: 'Metas', indice: 0 },
  { nome: 'Campanhas', indice: 3 },
  { nome: 'Feedback', indice: 7 },
  { nome: 'Brindoleta', indice: 8 },
  { nome: 'Financeiro', indice: 11 },
  { nome: 'Equipe', indice: 12 },
  { nome: 'Reuniões', indice: 13 },
]

const INTERVALO = 7000

export default function SistemaEmAcao() {
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [movimentoReduzido, setMovimentoReduzido] = useState(false)
  const inicioX = useRef<number | null>(null)

  const irPara = useCallback((indice: number) => {
    setAtivo((indice + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const atualizar = () => setMovimentoReduzido(media.matches)
    atualizar()
    media.addEventListener('change', atualizar)
    return () => media.removeEventListener('change', atualizar)
  }, [])

  useEffect(() => {
    if (pausado || movimentoReduzido) return
    const intervalo = window.setInterval(() => {
      setAtivo((atual) => (atual + 1) % slides.length)
    }, INTERVALO)
    return () => window.clearInterval(intervalo)
  }, [ativo, pausado, movimentoReduzido])

  const iniciarArrasto = (evento: PointerEvent<HTMLDivElement>) => {
    inicioX.current = evento.clientX
    evento.currentTarget.setPointerCapture(evento.pointerId)
    setPausado(true)
  }

  const terminarArrasto = (evento: PointerEvent<HTMLDivElement>) => {
    if (inicioX.current === null) return
    const distancia = evento.clientX - inicioX.current
    if (Math.abs(distancia) > 50) irPara(ativo + (distancia < 0 ? 1 : -1))
    inicioX.current = null
    setPausado(false)
  }

  const slideAtivo = slides[ativo]

  return (
    <section id="por-dentro" className="scroll-mt-20 overflow-hidden bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#101828]/10 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#2C4FE4] shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF4FA3]" aria-hidden="true" />
              18 telas reais · 7 áreas do sistema
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.035em] text-[#101828] sm:text-4xl lg:text-5xl">
              Veja como o BarberMeta trabalha a favor da sua barbearia.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#59677A] sm:text-lg">
              Explore cada função em uma sequência simples — da configuração ao resultado que o dono acompanha.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#101828]/10 bg-white px-4 py-2 text-xs font-bold text-[#59677A] shadow-sm">
            <span aria-hidden="true">↔</span>
            Passa sozinho · arraste para explorar
          </div>
        </div>

        <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Áreas mostradas no carrossel">
          {capitulos.map((capitulo) => {
            const selecionado = slideAtivo.grupo === capitulo.nome
            return (
              <button
                key={capitulo.nome}
                type="button"
                onClick={() => irPara(capitulo.indice)}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition ${selecionado ? 'border-[#101828] bg-[#101828] text-white shadow-lg' : 'border-[#101828]/10 bg-white text-[#59677A] hover:border-[#101828]/30 hover:text-[#101828]'}`}
                aria-pressed={selecionado}
              >
                {capitulo.nome}
              </button>
            )
          })}
        </nav>

        <div
          className="relative mt-5 select-none overflow-hidden rounded-[30px] border border-[#101828]/10 bg-[#08111F] shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocusCapture={() => setPausado(true)}
          onBlurCapture={() => setPausado(false)}
          onPointerDown={iniciarArrasto}
          onPointerUp={terminarArrasto}
          onPointerCancel={() => {
            inicioX.current = null
            setPausado(false)
          }}
          style={{ touchAction: 'pan-y' }}
          role="region"
          aria-roledescription="carrossel"
          aria-label="Telas e funcionalidades do BarberMeta"
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.8,.24,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${ativo * 100}%)` }}
          >
            {slides.map((slide, indice) => (
              <article key={`${slide.grupo}-${slide.passo}`} className="relative min-w-full" aria-hidden={indice !== ativo}>
                <div className="relative flex h-[570px] items-start justify-center overflow-hidden border-b border-white/10 bg-[#05070B] px-4 pt-5 sm:h-[650px] sm:px-8 sm:pt-7">
                  <div className="absolute inset-x-0 top-0 h-48 opacity-35 blur-3xl" style={{ background: `radial-gradient(circle at center, ${slide.cor}, transparent 65%)` }} aria-hidden="true" />
                  <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur sm:left-7 sm:top-7">
                    Tela {String(indice + 1).padStart(2, '0')} de {slides.length}
                  </div>
                  <div className="relative h-full w-full max-w-[330px] overflow-hidden rounded-t-[22px] border-x border-t border-white/15 bg-[#0C1018] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                    <Image
                      src={slide.imagem}
                      alt={slide.alt}
                      fill
                      sizes="(max-width: 640px) 82vw, 330px"
                      className="pointer-events-none object-contain object-top"
                      priority={indice === 0}
                      draggable={false}
                    />
                  </div>
                </div>

                <div className="relative min-h-[330px] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_42%)] px-6 pb-28 pt-7 sm:min-h-[310px] sm:px-10 sm:pb-24 sm:pt-9 lg:px-14">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#08111F]" style={{ backgroundColor: slide.cor }}>
                      {slide.grupo}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.13em] text-white/45">{slide.passo}</span>
                  </div>
                  <h3 className="mt-4 max-w-3xl text-balance text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-3xl">
                    {slide.titulo}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">{slide.descricao}</p>
                  <div className="mt-5 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold leading-relaxed text-white/85">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-[#08111F]" style={{ backgroundColor: slide.cor }} aria-hidden="true">✓</span>
                    <p><span className="font-black text-white">Por que faz diferença: </span>{slide.ganho}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="absolute bottom-5 left-6 right-6 z-20 flex items-center gap-4 sm:bottom-6 sm:left-10 sm:right-10 lg:left-14 lg:right-14">
            <span className="w-12 text-xs font-black tabular-nums text-white/65" aria-live="polite">
              {String(ativo + 1).padStart(2, '0')}/{slides.length}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((ativo + 1) / slides.length) * 100}%`, backgroundColor: slideAtivo.cor }} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => irPara(ativo - 1)}
                onPointerDown={(evento) => evento.stopPropagation()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl text-white transition hover:border-white/35 hover:bg-white/10"
                aria-label="Tela anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => irPara(ativo + 1)}
                onPointerDown={(evento) => evento.stopPropagation()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xl text-white transition hover:border-white/35 hover:bg-white/10"
                aria-label="Próxima tela"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-[#7A8798]">
          Imagens reais do BarberMeta em uso. Dados exibidos pertencem a uma conta de demonstração.
        </p>
      </div>
    </section>
  )
}
