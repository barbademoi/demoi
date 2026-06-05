'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ClipboardList,
  Users,
  Smartphone,
  Star,
  Mail,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

interface Feature {
  // Pode ser ícone Lucide (aceita size/stroke) ou ícone react-icons (size só).
  // Usamos render function pra normalizar a renderização do ícone.
  renderIcon: () => React.ReactNode
  titulo: string
  subtitulo: string
  bullets: string[]
}

const ICONE_BEGE = 'text-areia'

const FEATURES: Feature[] = [
  {
    renderIcon: () => <Sparkles size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'IA Mentora',
    subtitulo: 'O cérebro da Bússola.',
    bullets: [
      'Classifica suas observações em segundos',
      'Sugere fala pronta pra cada momento',
      'Resume sua semana automaticamente',
      'Princípio de liderança novo toda semana',
      'Tom configurável: direto, acolhedor ou motivacional',
    ],
  },
  {
    renderIcon: () => <ClipboardList size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'Modo Reunião',
    subtitulo: '6 momentos guiados, do começo ao fim.',
    bullets: [
      'Abertura, Revisão, Reconhecimento',
      'Equipe, Ajuste, Encerramento',
      'Princípio + sugestão de fala em cada um',
      'Marcar todos com um clique',
      'Cadência: diária, semanal, quinzenal ou mensal',
    ],
  },
  {
    renderIcon: () => <Users size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'Gestão da Equipe',
    subtitulo: 'Cada pessoa, um perfil completo.',
    bullets: [
      'Motivadores e estilo de comunicação',
      'Pontos fortes e a desenvolver',
      'Notas privadas que só você vê',
      'Tempo de casa e status',
      'Histórico completo de observações',
    ],
  },
  {
    renderIcon: () => <Smartphone size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'Link Privado pra Equipe',
    subtitulo: 'Cada colaborador tem o dele.',
    bullets: [
      'Instalável no celular como app (PWA)',
      'Timeline pessoal de anotações',
      'Confirmação de leitura + resposta',
      'Sem login, sem cadastro, sem app store',
      'Atualiza em tempo real',
    ],
  },
  {
    renderIcon: () => <Star size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'Feedback de Clientes',
    subtitulo: 'Cliente avalia, brinde sai automático.',
    bullets: [
      '5 estrelas + comentário curto',
      'Sorteio automático de brindes',
      'Código de resgate único com validade',
      'QR Code pronto pra colar na parede',
      'Inbox com filtros (estrelas, período, brinde)',
    ],
  },
  {
    renderIcon: () => <FcGoogle size={36} />,
    titulo: 'Captação Google Reviews',
    subtitulo: 'Cliente satisfeito vira 5★ no Maps.',
    bullets: [
      '5★ interno vira convite automático',
      'Cliente avalia no Google em 30 segundos',
      'Tracking de quem clicou no convite',
      'Sua empresa sobe no Maps',
      'Mais clientes encontram você sozinhos',
    ],
  },
  {
    renderIcon: () => <Mail size={36} strokeWidth={1.5} className={ICONE_BEGE} />,
    titulo: 'Mensagens dos Colaboradores',
    subtitulo: 'Via de mão dupla com a equipe.',
    bullets: [
      'Equipe envia mensagem pra você',
      'Anônimo de verdade (sem rastro)',
      'Ou identificado, se preferir',
      'Inbox com badge de não-lidas',
      'Cultura de feedback dos dois lados',
    ],
  },
]

export function FeaturesCarrossel() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  // Atualiza dot ativo conforme scroll. Usa o card mais próximo do centro
  // (ou do início, em telas largas com múltiplos cards visíveis).
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      const cards = el.querySelectorAll<HTMLElement>('[data-card]')
      if (cards.length === 0) return
      const center = el.scrollLeft + el.clientWidth / 2
      let bestIdx = 0
      let bestDist = Infinity
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2
        const dist = Math.abs(cardCenter - center)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      })
      setActiveIdx(bestIdx)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (dir: 'prev' | 'next') => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    if (!card) return
    const step = card.clientWidth + 16 // largura + gap-4
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' })
  }

  const scrollToIdx = (idx: number) => {
    const el = scrollerRef.current
    if (!el) return
    const cards = el.querySelectorAll<HTMLElement>('[data-card]')
    const target = cards[idx]
    if (target) {
      el.scrollTo({ left: target.offsetLeft - 16, behavior: 'smooth' })
    }
  }

  return (
    <section className="px-4 py-20 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.5 }}
            className="text-xs uppercase tracking-wider text-marrom font-semibold"
          >
            Tudo que vem na Bússola
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl text-preto leading-tight"
          >
            Não é só a reunião. É o sistema inteiro.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-grafite text-sm"
          >
            Deslize pra ver →
          </motion.p>
        </div>

        <div className="relative">
          {/* Setas — desktop only */}
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollTo('prev')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white border border-border shadow-md items-center justify-center hover:bg-linho transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={1.8} className="text-marrom" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollTo('next')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white border border-border shadow-md items-center justify-center hover:bg-linho transition-colors"
          >
            <ChevronRight size={20} strokeWidth={1.8} className="text-marrom" />
          </button>

          {/* Scroller horizontal com scroll-snap */}
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}
          >
            {FEATURES.map((f, i) => (
              <article
                key={f.titulo}
                data-card
                className="snap-center shrink-0 w-[280px] sm:w-[300px] rounded-xl bg-marrom-escuro text-areia p-6 shadow-lg"
              >
                <div className="mb-4">{f.renderIcon()}</div>
                <h3 className="font-serif text-2xl leading-tight mb-1.5">{f.titulo}</h3>
                  <p className="text-sm text-areia/70 mb-4 leading-relaxed">{f.subtitulo}</p>
                  <ul className="space-y-2.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm leading-snug">
                        <Check size={14} strokeWidth={2.5} className="text-marrom-claro mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                <p className="text-[10px] uppercase tracking-wider text-areia/40 mt-5">
                  {String(i + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                </p>
              </article>
            ))}
          </div>

          {/* Dots indicadores */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para card ${i + 1}`}
                onClick={() => scrollToIdx(i)}
                className={[
                  'h-2 rounded-full transition-all',
                  activeIdx === i ? 'w-8 bg-marrom' : 'w-2 bg-marrom/25 hover:bg-marrom/50',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
