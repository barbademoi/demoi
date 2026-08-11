'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type Slide = {
  etapa: string
  titulo: string
  descricao: string
  imagem: string
  alt: string
  cor: string
  fundo: string
  destaques: string[]
}

const slides: Slide[] = [
  {
    etapa: '01 · Visão do dono',
    titulo: 'Veja a meta e o ritmo da barbearia em uma única tela.',
    descricao: 'O painel mostra quanto já entrou, quanto falta e o valor necessário por dia para alcançar a meta do mês.',
    imagem: '/prints/dashboard-meta-coletiva.png',
    alt: 'Painel do BarberMeta mostrando meta coletiva, faturamento e ritmo diário',
    cor: '#FFD84D',
    fundo: 'from-[#FFD84D]/22 via-[#FF8A3D]/8 to-transparent',
    destaques: ['Meta coletiva em tempo real', 'Ritmo necessário por dia'],
  },
  {
    etapa: '02 · Equipe em movimento',
    titulo: 'Transforme evolução em um ranking que todo mundo entende.',
    descricao: 'Cada profissional enxerga sua posição, o próprio resultado e quanto já avançou nas metas Bronze, Prata e Ouro.',
    imagem: '/prints/01-dashboard-ranking.png',
    alt: 'Ranking real da equipe no BarberMeta com fotos, resultados e progresso nas metas',
    cor: '#3B82F6',
    fundo: 'from-[#3B82F6]/24 via-[#36BFFA]/8 to-transparent',
    destaques: ['Ranking visual da equipe', 'Progresso individual por meta'],
  },
  {
    etapa: '03 · Campanhas',
    titulo: 'Direcione a equipe para os serviços que você quer vender mais.',
    descricao: 'Escolha os serviços, defina quantos pontos cada venda vale e crie uma campanha simples de explicar e acompanhar.',
    imagem: '/prints/02-campanha-pontos.jpg',
    alt: 'Configuração de uma campanha de pontos com serviços e pontuações no BarberMeta',
    cor: '#FF4FA3',
    fundo: 'from-[#FF4FA3]/24 via-[#9B6CFF]/8 to-transparent',
    destaques: ['Pontos por serviço ou produto', 'Premiação configurada pelo dono'],
  },
  {
    etapa: '04 · Visão do profissional',
    titulo: 'Cada profissional acompanha o próprio resultado pelo celular.',
    descricao: 'Sem conta e sem senha: o barbeiro recebe um link individual para ver comissão, ritmo, insights e metas.',
    imagem: '/prints/03-barbeiro-individual.png',
    alt: 'Tela individual de um barbeiro mostrando comissão, ritmo, insights e metas',
    cor: '#9B6CFF',
    fundo: 'from-[#9B6CFF]/24 via-[#6D5BFF]/8 to-transparent',
    destaques: ['Acesso individual e simples', 'Comissão, ritmo e insights'],
  },
  {
    etapa: '05 · Rotina rápida',
    titulo: 'Atualize o dia da equipe em poucos toques.',
    descricao: 'O lançamento diário registra os serviços realizados e atualiza automaticamente pontos, metas e rankings.',
    imagem: '/prints/img_6057.png',
    alt: 'Tela de lançamento diário do BarberMeta com serviços, quantidades e pontos',
    cor: '#36BFFA',
    fundo: 'from-[#36BFFA]/24 via-[#00D4A3]/8 to-transparent',
    destaques: ['Lançamento simples no celular', 'Painéis atualizados automaticamente'],
  },
  {
    etapa: '06 · Voz do cliente',
    titulo: 'Use o feedback para reconhecer a equipe e melhorar o atendimento.',
    descricao: 'O dono acompanha avaliações, comentários e brindes. O profissional também pode ver os elogios recebidos.',
    imagem: '/prints/feedback-painel.png',
    alt: 'Painel de feedbacks de clientes com avaliações, comentários e brindes',
    cor: '#D8FF00',
    fundo: 'from-[#D8FF00]/20 via-[#00D4A3]/8 to-transparent',
    destaques: ['Avaliações organizadas em um painel', 'Reconhecimento ligado ao profissional'],
  },
]

const INTERVALO = 5200

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
  }, [pausado, movimentoReduzido])

  const iniciarArrasto = (evento: PointerEvent<HTMLDivElement>) => {
    inicioX.current = evento.clientX
    evento.currentTarget.setPointerCapture(evento.pointerId)
    setPausado(true)
  }

  const terminarArrasto = (evento: PointerEvent<HTMLDivElement>) => {
    if (inicioX.current === null) return
    const distancia = evento.clientX - inicioX.current
    if (Math.abs(distancia) > 50) {
      irPara(ativo + (distancia < 0 ? 1 : -1))
    }
    inicioX.current = null
    setPausado(false)
  }

  return (
    <section id="por-dentro" className="scroll-mt-20 overflow-hidden bg-[#F6F4EF] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#101828]/10 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#2C4FE4] shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF4FA3]" aria-hidden="true" />
              Veja o BarberMeta por dentro
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-[-0.035em] text-[#101828] sm:text-4xl lg:text-5xl">
              Da meta ao atendimento: veja como cada etapa funciona.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#59677A] sm:text-lg">
              Telas reais do sistema, com a rotina que o dono e a equipe usam no dia a dia.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#101828]/10 bg-white px-4 py-2 text-xs font-bold text-[#59677A] shadow-sm">
            <span aria-hidden="true">↔</span>
            Passa sozinho · arraste para explorar
          </div>
        </div>

        <div
          className="relative mt-9 select-none overflow-hidden rounded-[30px] border border-[#101828]/10 bg-[#08111F] shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
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
          aria-label="Funcionalidades do BarberMeta"
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.8,.24,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(-${ativo * 100}%)` }}
          >
            {slides.map((slide, indice) => (
              <article
                key={slide.etapa}
                className={`relative grid min-w-full overflow-hidden bg-gradient-to-br ${slide.fundo} lg:grid-cols-[0.78fr_1.22fr]`}
                aria-hidden={indice !== ativo}
              >
                <div className="relative z-10 flex min-h-[360px] flex-col justify-center p-6 sm:p-9 lg:min-h-[570px] lg:p-12">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slide.cor }} aria-hidden="true" />
                    <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: slide.cor }}>
                      {slide.etapa}
                    </p>
                  </div>
                  <h3 className="mt-5 text-balance text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-3xl">
                    {slide.titulo}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65 sm:text-base">
                    {slide.descricao}
                  </p>
                  <ul className="mt-7 space-y-3">
                    {slide.destaques.map((destaque) => (
                      <li key={destaque} className="flex items-center gap-3 text-sm font-semibold text-white/85">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-[#08111F]" style={{ backgroundColor: slide.cor }} aria-hidden="true">✓</span>
                        {destaque}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative flex min-h-[470px] items-center justify-center px-4 pb-5 sm:px-8 sm:pb-8 lg:min-h-[570px] lg:py-8 lg:pl-0 lg:pr-8">
                  <div className="absolute inset-10 rounded-full blur-3xl opacity-25" style={{ backgroundColor: slide.cor }} aria-hidden="true" />
                  <div className="relative h-[440px] w-full overflow-hidden rounded-[22px] border border-white/15 bg-[#05070B] shadow-2xl shadow-black/50 lg:h-[510px]">
                    <div className="flex h-9 items-center gap-1.5 border-b border-white/10 bg-[#121722] px-4" aria-hidden="true">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                      <span className="ml-auto text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">BarberMeta</span>
                    </div>
                    <div className="relative h-[calc(100%-2.25rem)] w-full">
                      <Image
                        src={slide.imagem}
                        alt={slide.alt}
                        fill
                        sizes="(max-width: 1024px) 92vw, 58vw"
                        className="pointer-events-none object-contain object-top"
                        priority={indice === 0}
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="absolute bottom-5 left-6 right-6 z-20 flex items-center justify-between gap-4 lg:bottom-7 lg:left-12 lg:right-auto lg:w-[calc(39%-3rem)]">
            <div className="flex items-center gap-2">
              {slides.map((slide, indice) => (
                <button
                  key={slide.etapa}
                  type="button"
                  onClick={() => irPara(indice)}
                  className={`h-2 rounded-full transition-all duration-300 ${indice === ativo ? 'w-8 bg-white' : 'w-2 bg-white/25 hover:bg-white/50'}`}
                  aria-label={`Mostrar ${slide.etapa}`}
                  aria-current={indice === ativo ? 'true' : undefined}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => irPara(ativo - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/25 text-xl text-white transition hover:border-white/35 hover:bg-white/10"
                aria-label="Funcionalidade anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => irPara(ativo + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/25 text-xl text-white transition hover:border-white/35 hover:bg-white/10"
                aria-label="Próxima funcionalidade"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-[#7A8798]">
          Imagens reais do BarberMeta em uso. Algumas telas podem receber pequenas atualizações visuais.
        </p>
      </div>
    </section>
  )
}
