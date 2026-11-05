'use client'

/**
 * AVISO DIÁRIO DE LANÇAMENTO.
 *
 * O sistema inteiro é calculado em cima do que é lançado: meta, ranking,
 * projeção de fechamento, comparativo com o mês passado e prêmio. Um dia sem
 * lançamento não deixa um buraco pequeno — ele puxa a média para baixo, muda
 * a projeção e desarruma o ranking, e aí o número que aparece na tela não bate
 * com o que a barbearia fez. Quem vê isso não conclui "faltou lançar"; conclui
 * "o sistema está errado". Este aviso existe para evitar essa conclusão.
 *
 * ── DUAS VERSÕES ────────────────────────────────────────────────────────────
 * `completa` para quem LANÇA (o dono, e o barbeiro quando a campanha está em
 * "barbeiro lança"). `curta` para o barbeiro que não lança: cobrar dele um
 * lançamento que o sistema não deixa ele fazer é só frustração, então a ele o
 * aviso explica de onde vêm os pontos e manda falar com o dono.
 *
 * ── UMA VEZ POR DIA ─────────────────────────────────────────────────────────
 * A regra está em `lib/popups/avisoLancamento` (dia de São Paulo, chave por
 * usuário, storage que falha mostra o aviso). A marca é gravada ao ABRIR, não
 * ao fechar: assim recarregar a página sem fechar o modal também não o traz de
 * volta, e qualquer forma de fechar — botão, X, Esc, clique fora — conta como
 * visto, sem precisar de três caminhos diferentes para a mesma gravação.
 *
 * ── NÃO EMPILHA ─────────────────────────────────────────────────────────────
 * Entra na fila de `lib/popups/fila` com a prioridade mais baixa. Se o
 * lembrete de meta ou um popup da Brindoleta estiver na tela, este espera a
 * vez — e, se a pessoa sair antes, aparece no próximo acesso.
 *
 * ── LETRA GRANDE, DE PROPÓSITO ──────────────────────────────────────────────
 * Título em 30px, corpo em 19px, peso 500 ou mais. O público é barbeiro, boa
 * parte com mais de 40 anos, lendo no celular dentro da barbearia. Texto fino
 * e pequeno aqui é o mesmo que não escrever.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFilaDePopups } from '@/lib/popups/fila'
import { jaVistoHoje, marcarVistoHoje } from '@/lib/popups/avisoLancamento'

/** Latão e verde do redesign. Hex direto: não estão no tailwind.config ainda. */
const LATAO = '#E2C68C'
const LATAO_CLARO = '#F4D998'
const VERDE = '#3FE28F'

type Variante = 'completa' | 'curta'

interface Props {
  /** Quem está vendo. Entra na chave do dia — o aviso é por pessoa. */
  userId: string
  variante?: Variante
}

const TEXTO = {
  completa: {
    titulo: 'Lance todo dia. O BarberMeta faz o resto.',
    corpo:
      'Suas metas, o ranking da equipe, a projeção de fechamento e os prêmios são calculados em cima do que você lança. Se o dia fica sem lançamento, o sistema entende errado e os números não batem.',
    itens: [
      'Faça os lançamentos ao fim de cada dia.',
      'Esqueceu algum dia? Dá para lançar dias anteriores.',
      'Equipe e dono veem o mesmo resultado, certo.',
    ],
  },
  curta: {
    titulo: 'Seus pontos vêm do lançamento do dia.',
    corpo:
      'Seus pontos e seu prêmio dependem dos lançamentos do dia. Confira com o dono se está tudo lançado.',
    itens: [] as string[],
  },
} as const

export default function AvisoLancamentoDiario({ userId, variante = 'completa' }: Props) {
  // Decidido uma vez, no primeiro render do cliente. Depois de abrir, a marca
  // do dia já está gravada, e reavaliar faria o popup se fechar sozinho.
  const [quer] = useState(() => {
    if (typeof window === 'undefined') return false
    if (!userId) return false
    return !jaVistoHoje(window.localStorage, userId)
  })

  const { minhaVez, abrir, fechar } = useFilaDePopups('aviso-lancamento', quer)
  const [aberto, setAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const [semMovimento, setSemMovimento] = useState(false)

  const caixaRef = useRef<HTMLDivElement | null>(null)
  const botaoRef = useRef<HTMLButtonElement | null>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setSemMovimento(
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    )
  }, [])

  // Abre quando é a vez. O atraso curto existe para o painel desenhar
  // primeiro: um modal que nasce junto com a página cobre os números antes de
  // a pessoa ver qualquer coisa, e o reflexo é fechar sem ler.
  useEffect(() => {
    if (!minhaVez || aberto) return
    const t = window.setTimeout(() => {
      if (typeof window !== 'undefined') focoAnterior.current = document.activeElement as HTMLElement
      marcarVistoHoje(window.localStorage, userId)
      setAberto(true)
      abrir()
    }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaVez, aberto])

  const encerrar = useCallback(() => {
    setSaindo(true)
    window.setTimeout(() => {
      setAberto(false)
      setSaindo(false)
      fechar()
      // Devolve o foco a quem o tinha. Sem isto, quem usa teclado volta para
      // o começo da página a cada aviso.
      focoAnterior.current?.focus?.()
    }, semMovimento ? 0 : 150)
  }, [fechar, semMovimento])

  // Foco no "Entendi" ao abrir: é a saída, e tem de ser a primeira coisa
  // alcançável por teclado.
  useEffect(() => {
    if (aberto) botaoRef.current?.focus()
  }, [aberto])

  // Esc fecha, Tab fica preso dentro do modal, e o fundo para de rolar.
  useEffect(() => {
    if (!aberto) return

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); encerrar(); return }
      if (e.key !== 'Tab') return

      const caixa = caixaRef.current
      if (!caixa) return
      const focaveis = Array.from(
        caixa.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focaveis.length === 0) return

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const atual = document.activeElement

      // A armadilha: no primeiro com Shift+Tab volta para o último, e no
      // último com Tab volta para o primeiro. Sem isso, o Tab escapa para a
      // página atrás do overlay, que está inerte — e o foco desaparece.
      if (e.shiftKey && (atual === primeiro || !caixa.contains(atual))) {
        e.preventDefault(); ultimo.focus()
      } else if (!e.shiftKey && (atual === ultimo || !caixa.contains(atual))) {
        e.preventDefault(); primeiro.focus()
      }
    }

    window.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
  }, [aberto, encerrar])

  if (!aberto) return null

  const t = TEXTO[variante]
  const anim = semMovimento
    ? ''
    : saindo
      ? 'opacity-0 translate-y-2'
      : 'opacity-100 translate-y-0'

  return (
    <div
      // z-[90]: acima dos outros modais do painel (60, 70, 80). A fila garante
      // que não há dois ao mesmo tempo; o z-index é só a rede de segurança.
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm ${
        semMovimento ? '' : `transition-opacity duration-150 ${saindo ? 'opacity-0' : 'opacity-100'}`
      }`}
      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-lancamento-titulo"
      aria-describedby="aviso-lancamento-corpo"
      onClick={encerrar}
    >
      <div
        ref={caixaRef}
        onClick={(e) => e.stopPropagation()}
        // No celular ocupa quase a largura toda: o `p-4` do pai é a margem de
        // 16px pedida, e `max-w-[30rem]` segura no desktop.
        // `max-h-[92vh]` + coluna: com letra deste tamanho, a versão completa
        // não cabe num celular de 667px de altura. Em vez de encolher a fonte
        // — que é justamente o que este aviso não pode fazer —, o conteúdo
        // rola e o botão fica preso no rodapé, sempre à vista.
        className={`relative flex max-h-[92vh] w-full max-w-[30rem] flex-col overflow-hidden rounded-3xl border bg-[#0F0F13] shadow-[0_24px_70px_rgba(0,0,0,.65)] ${
          semMovimento ? '' : `transform transition-all duration-200 ${anim}`
        }`}
        style={{ borderColor: 'rgba(226,198,140,0.28)' }}
      >
        {/* Fio de latão no topo: separa o aviso do resto sem pesar a caixa. */}
        <div
          aria-hidden
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${LATAO}, ${LATAO_CLARO}, ${LATAO})` }}
        />

        <button
          type="button"
          onClick={encerrar}
          aria-label="Fechar aviso"
          className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-5 sm:px-8 sm:pt-7">
          {/* Ícone de calendário em latão. */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
            style={{ background: 'rgba(226,198,140,0.12)', border: `1px solid rgba(226,198,140,0.3)` }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" fill="none" stroke={LATAO_CLARO} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
              <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
              <path d="m8.5 14.5 2.2 2.2 4.3-4.6" stroke={VERDE} strokeWidth="2.2" />
            </svg>
          </div>

          <h2
            id="aviso-lancamento-titulo"
            className="mt-4 pr-10 text-[28px] font-bold leading-[1.15] text-white sm:mt-5 sm:text-[32px]"
          >
            {t.titulo}
          </h2>

          <p
            id="aviso-lancamento-corpo"
            className="mt-3 text-[18px] font-medium leading-[1.45] text-white/80 sm:mt-3.5 sm:text-[19px]"
          >
            {t.corpo}
          </p>

          {t.itens.length > 0 && (
            <ul className="mt-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 sm:mt-5 sm:space-y-3 sm:p-4">
              {t.itens.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="mt-0.5 h-6 w-6 shrink-0" aria-hidden
                  >
                    <path d="m4 12.5 5 5L20 6.5" />
                  </svg>
                  <span className="text-[18px] font-medium leading-[1.35] text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          )}

        </div>

        {/* Rodapé fixo: o "Entendi" não pode exigir rolagem pra ser alcançado.
            O degradê acima dele avisa que o texto continua — sem isso, numa
            tela baixa a lista cortada parece o fim do aviso. */}
        <div className="relative shrink-0 border-t border-white/10 bg-[#0F0F13] px-6 pb-6 pt-4 sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#0F0F13] to-transparent"
          />
          <button
            ref={botaoRef}
            type="button"
            onClick={encerrar}
            className="flex min-h-[56px] w-full items-center justify-center rounded-2xl px-5 text-[19px] font-bold text-[#0A0A0C] transition hover:brightness-105 active:scale-[.99]"
            style={{ background: VERDE, boxShadow: '0 12px 30px rgba(63,226,143,0.18)' }}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
