'use client'

/**
 * POPUP DE ATIVAÇÃO DAS NOTIFICAÇÕES.
 *
 * Push é a única coisa do sistema que a pessoa precisa LIGAR antes de
 * funcionar, e o navegador só deixa pedir a permissão a partir de um clique.
 * Então existe este convite: ele explica o que vai chegar, e o clique nele é
 * o gesto que o navegador exige.
 *
 * ── UMA TELA DIFERENTE PRO IPHONE ───────────────────────────────────────────
 * No Android e no computador é um botão e pronto. No iOS, a Apple só entrega
 * push pra site adicionado à tela de início — no Safari comum a API nem
 * existe. Mostrar "ativar" lá daria um erro silencioso e a pessoa concluiria
 * que o sistema não funciona. Então, no iPhone em aba, o popup vira instrução
 * de instalação, com os três toques do Safari escritos.
 *
 * ── QUANDO APARECE ──────────────────────────────────────────────────────────
 * Entra na fila de popups (`lib/popups/fila`) e espera a vez — nunca por cima
 * de outro. Reaparece no máximo a cada 7 dias enquanto não estiver ativo, e
 * some pra sempre depois de ativado ou recusado explicitamente. Insistir todo
 * dia numa permissão é como se ganha um "bloquear" permanente do navegador.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFilaDePopups } from '@/lib/popups/fila'
import { ativar, estadoAtual, ehIOS, type EstadoPush } from '@/lib/push/navegador'

const LATAO = '#E2C68C'
const LATAO_CLARO = '#F4D998'
const VERDE = '#3FE28F'

/** Espera entre convites, enquanto a pessoa não ativa nem recusa. */
const DIAS_ENTRE_CONVITES = 7
const CHAVE = 'barbermeta_push_convite'

type Papel = 'dono' | 'barbeiro'

interface Props {
  papel: Papel
  /** Quem está vendo — a chave do adiamento é por pessoa. */
  id: string
  /** Chave pública VAPID. Vazia = servidor ainda não configurado. */
  chavePublica: string
  /** Grava a inscrição no servidor. Devolve erro em texto, ou null. */
  aoInscrever: (d: { endpoint: string; p256dh: string; auth: string; userAgent: string }) => Promise<string | null>
}

const TEXTO = {
  dono: {
    titulo: 'Receba os avisos no celular',
    corpo: 'O BarberMeta te avisa no aparelho quando precisa da sua mão — sem você precisar abrir o sistema pra descobrir.',
    itens: [
      'Lembrete de lançar o dia, a partir das 18h',
      'Quando um barbeiro lança a pontuação dele',
      'No fim do mês, pra montar a meta do mês seguinte',
    ],
  },
  barbeiro: {
    titulo: 'Receba os avisos no celular',
    corpo: 'Seus pontos, sua comissão e o que falta pro prêmio chegam no aparelho, sem você precisar abrir o link.',
    itens: [
      'Lembrete de lançar seus pontos, a partir das 18h',
      'Quantos pontos faltam pro seu prêmio',
      'Quando o dono lança o dia e sua comissão muda',
    ],
  },
} as const

function adiado(id: string): boolean {
  try {
    const bruto = window.localStorage.getItem(`${CHAVE}_${id}`)
    if (!bruto) return false
    if (bruto === 'nao') return true            // recusou: não insiste mais
    const quando = Number(bruto)
    if (!Number.isFinite(quando)) return false
    return Date.now() - quando < DIAS_ENTRE_CONVITES * 86400000
  } catch {
    // Sem storage, o convite aparece. Entre insistir e nunca convidar, o erro
    // barato é insistir — e o popup tem saída em dois lugares.
    return false
  }
}

function marcar(id: string, valor: 'agora' | 'nao') {
  try {
    window.localStorage.setItem(`${CHAVE}_${id}`, valor === 'nao' ? 'nao' : String(Date.now()))
  } catch { /* sem storage, o convite volta em 7 dias de qualquer forma */ }
}

export default function AtivarNotificacoes({ papel, id, chavePublica, aoInscrever }: Props) {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [quer, setQuer] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)
  const [semMovimento, setSemMovimento] = useState(false)

  const caixaRef = useRef<HTMLDivElement | null>(null)
  const botaoRef = useRef<HTMLButtonElement | null>(null)

  // O estado do push só se conhece no navegador, e envolve await — por isso
  // sai num efeito, e não no primeiro render.
  useEffect(() => {
    let vivo = true
    setSemMovimento(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    estadoAtual().then((e) => {
      if (!vivo) return
      setEstado(e)
      // Já ativo, bloqueado ou sem suporte: não há convite a fazer. Bloqueado
      // só volta pelas configurações do navegador, e um popup não desfaz isso.
      const convidavel = e === 'pode-ativar' || e === 'precisa-instalar'
      setQuer(convidavel && !!id && !adiado(id))
    })
    return () => { vivo = false }
  }, [id])

  const { minhaVez, abrir, fechar } = useFilaDePopups('ativar-notificacoes', quer)

  useEffect(() => {
    if (!minhaVez || aberto) return
    const t = window.setTimeout(() => { setAberto(true); abrir() }, 800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaVez, aberto])

  const encerrar = useCallback((comoRecusa: boolean) => {
    marcar(id, comoRecusa ? 'nao' : 'agora')
    setAberto(false)
    fechar()
  }, [fechar, id])

  useEffect(() => { if (aberto) botaoRef.current?.focus() }, [aberto])

  useEffect(() => {
    if (!aberto) return
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); encerrar(false); return }
      if (e.key !== 'Tab') return
      const caixa = caixaRef.current
      if (!caixa) return
      const focaveis = Array.from(
        caixa.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      const atual = document.activeElement
      if (e.shiftKey && (atual === primeiro || !caixa.contains(atual))) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && (atual === ultimo || !caixa.contains(atual))) { e.preventDefault(); primeiro.focus() }
    }
    window.addEventListener('keydown', aoTeclar)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = anterior
    }
  }, [aberto, encerrar])

  async function ligar() {
    setErro(null)
    setEnviando(true)
    const r = await ativar(chavePublica)
    if (!r.ok) {
      setEnviando(false)
      setEstado(r.estado)
      // Bloqueado não é erro a mostrar em vermelho: a tela inteira muda, e
      // explica onde desbloquear.
      if (r.estado !== 'bloqueado' && r.estado !== 'precisa-instalar') {
        setErro(r.erro ?? 'Não deu pra ativar agora. Tente de novo.')
      }
      return
    }
    const falha = await aoInscrever(r.inscricao)
    setEnviando(false)
    if (falha) { setErro(falha); return }
    setPronto(true)
    // Deixa a confirmação na tela um instante: sem ela, o popup some no
    // clique e a pessoa fica sem saber se funcionou.
    window.setTimeout(() => encerrar(false), 1700)
  }

  if (!aberto || !estado) return null

  const t = TEXTO[papel]
  const precisaInstalar = estado === 'precisa-instalar'
  const bloqueado = estado === 'bloqueado'
  const naApple = ehIOS()

  return (
    <div
      className={`fixed inset-0 z-[88] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm ${
        semMovimento ? '' : 'transition-opacity duration-150'
      }`}
      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ativar-push-titulo"
      onClick={() => encerrar(false)}
    >
      <div
        ref={caixaRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-[30rem] flex-col overflow-hidden rounded-3xl border bg-[#0F0F13] shadow-[0_24px_70px_rgba(0,0,0,.65)]"
        style={{ borderColor: 'rgba(226,198,140,0.28)' }}
      >
        <div aria-hidden className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${LATAO}, ${LATAO_CLARO}, ${LATAO})` }} />

        <button
          type="button"
          onClick={() => encerrar(false)}
          aria-label="Fechar"
          className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-5 sm:px-8 sm:pt-7">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
            style={{ background: 'rgba(226,198,140,0.12)', border: '1px solid rgba(226,198,140,0.3)' }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" fill="none" stroke={LATAO_CLARO} strokeWidth="1.9"
              strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7">
              <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2 7.5-2 7.5h16s-2-1.5-2-7.5Z" />
              <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
            </svg>
          </div>

          {pronto ? (
            <>
              <h2 id="ativar-push-titulo" className="mt-4 pr-10 text-[28px] font-bold leading-[1.15] text-white sm:text-[30px]">
                Pronto. Avisos ligados.
              </h2>
              <p className="mt-3 text-[18px] font-medium leading-[1.45] text-white/80">
                A partir de agora o BarberMeta fala com você pelo celular. Dá pra desligar quando quiser,
                nas configurações do aparelho.
              </p>
            </>
          ) : bloqueado ? (
            <>
              <h2 id="ativar-push-titulo" className="mt-4 pr-10 text-[28px] font-bold leading-[1.15] text-white sm:text-[30px]">
                As notificações estão bloqueadas
              </h2>
              <p className="mt-3 text-[18px] font-medium leading-[1.45] text-white/80">
                Alguém já recusou neste aparelho, e só as configurações do navegador desfazem isso.
              </p>
              <ol className="mt-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-[17px] font-medium leading-[1.4] text-white/90">
                <li>1. Toque no cadeado, ao lado do endereço.</li>
                <li>2. Abra <span className="text-white">Notificações</span>.</li>
                <li>3. Troque para <span className="text-white">Permitir</span> e recarregue a página.</li>
              </ol>
            </>
          ) : precisaInstalar ? (
            <>
              <h2 id="ativar-push-titulo" className="mt-4 pr-10 text-[28px] font-bold leading-[1.15] text-white sm:text-[30px]">
                No iPhone, instale o app primeiro
              </h2>
              <p className="mt-3 text-[18px] font-medium leading-[1.45] text-white/80">
                A Apple só manda notificação pra quem adiciona o BarberMeta à tela de início.
                São três toques, uma vez só:
              </p>
              <ol className="mt-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-[17px] font-medium leading-[1.4] text-white/90">
                <li>1. Toque em <span className="text-white">Compartilhar</span> — o quadradinho com a seta pra cima, embaixo.</li>
                <li>2. Desça e toque em <span className="text-white">Adicionar à Tela de Início</span>.</li>
                <li>3. Abra o BarberMeta pelo ícone novo e ative os avisos por lá.</li>
              </ol>
              <p className="mt-3 text-[15px] leading-snug text-white/55">
                Precisa de iOS 16.4 ou mais novo. No Android e no computador não precisa instalar nada.
              </p>
            </>
          ) : (
            <>
              <h2 id="ativar-push-titulo" className="mt-4 pr-10 text-[28px] font-bold leading-[1.15] text-white sm:text-[30px]">
                {t.titulo}
              </h2>
              <p className="mt-3 text-[18px] font-medium leading-[1.45] text-white/80">{t.corpo}</p>
              <ul className="mt-4 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5">
                {t.itens.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden>
                      <path d="m4 12.5 5 5L20 6.5" />
                    </svg>
                    <span className="text-[17px] font-medium leading-[1.35] text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
              {naApple && (
                <p className="mt-3 text-[15px] leading-snug text-white/55">
                  No iPhone, os avisos só chegam com o BarberMeta na tela de início.
                </p>
              )}
              {erro && <p className="mt-3 text-[16px] font-medium text-red-400">{erro}</p>}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#0F0F13] px-6 pb-6 pt-4 sm:px-8">
          {pronto || bloqueado || precisaInstalar ? (
            <button
              ref={botaoRef}
              type="button"
              onClick={() => encerrar(bloqueado)}
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl px-5 text-[19px] font-bold text-[#0A0A0C] transition hover:brightness-105 active:scale-[.99]"
              style={{ background: VERDE, boxShadow: '0 12px 30px rgba(63,226,143,0.18)' }}
            >
              Entendi
            </button>
          ) : (
            <>
              <button
                ref={botaoRef}
                type="button"
                disabled={enviando}
                onClick={ligar}
                className="flex min-h-[56px] w-full items-center justify-center rounded-2xl px-5 text-[19px] font-bold text-[#0A0A0C] transition hover:brightness-105 active:scale-[.99] disabled:opacity-70"
                style={{ background: VERDE, boxShadow: '0 12px 30px rgba(63,226,143,0.18)' }}
              >
                {enviando ? 'Ativando…' : 'Ativar os avisos'}
              </button>
              <div className="mt-2 flex items-center justify-between gap-3">
                <button type="button" onClick={() => encerrar(false)}
                  className="min-h-[44px] px-1 text-[15px] font-semibold text-white/45 transition hover:text-white/75">
                  Agora não
                </button>
                <button type="button" onClick={() => encerrar(true)}
                  className="min-h-[44px] px-1 text-[15px] font-semibold text-white/30 transition hover:text-white/60">
                  Não quero avisos
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
