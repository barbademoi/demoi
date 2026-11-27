'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFilaDePopups } from '@/lib/popups/fila'
import { deveOfertarTarefix } from '@/app/dashboard/tarefix/actions'
import { Logo } from '@/components/tarefix/Logo'
import TarefixApresentacao from './TarefixApresentacao'

/**
 * POPUP DE OFERTA DO TAREFIX (dashboard).
 *
 * Uma tela só, direta: o que é, 3 ganhos, preço e o botão. "Ver como
 * funciona" abre a apresentação em 6 passos. Só para quem não tem o Tarefix
 * (o servidor decide). Frequência:
 *  - uma vez por sessão;
 *  - "Agora não" / X: volta em 2 dias;
 *  - "Não tenho interesse": volta em 30 dias.
 * `/dashboard?popup=tarefix` força a exibição (para o admin conferir).
 */
const CHAVE_ADIADO = 'barbermeta:tarefix-oferta-ate'
const CHAVE_SESSAO = 'barbermeta:tarefix-oferta-visto'
const DIA = 24 * 60 * 60 * 1000

function adiadoAte(): number {
  try {
    return Number(window.localStorage.getItem(CHAVE_ADIADO) ?? 0) || 0
  } catch {
    return 0
  }
}

function adiar(dias: number) {
  try {
    window.localStorage.setItem(CHAVE_ADIADO, String(Date.now() + dias * DIA))
  } catch {
    /* storage bloqueado: segue */
  }
}

function jaViuNaSessao(): boolean {
  try {
    return Boolean(window.sessionStorage.getItem(CHAVE_SESSAO))
  } catch {
    return false
  }
}

const GANHOS = [
  ['📋', 'A equipe sabe o que fazer e até que horas', 'Abrir, limpar, repor, postar… cada um no próprio celular, sem app.'],
  ['📷', 'Prova com foto e checklist', 'Você aprova ou devolve. Nada de “eu fiz” sem mostrar.'],
  ['📊', 'Você vê quem cumpriu, em tempo real', 'A % do dia e do mês de cada um, e bônus para quem bate a meta.'],
] as const

export default function TarefixLaunchModal() {
  const pathname = usePathname()
  // lido no efeito (window), para não exigir Suspense em toda página que usa o menu
  const [forcar, setForcar] = useState(false)
  const [quer, setQuer] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [passos, setPassos] = useState(false)
  const fecharRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setForcar(new URLSearchParams(window.location.search).get('popup') === 'tarefix')
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/dashboard') return
    if (!forcar && (jaViuNaSessao() || adiadoAte() > Date.now())) return
    let cancel = false
    ;(async () => {
      try {
        // só para quem não tem o Tarefix (nem pedido em análise) — o servidor decide
        if ((forcar || (await deveOfertarTarefix())) && !cancel) setQuer(true)
      } catch {
        /* sem popup se não deu para conferir */
      }
    })()
    return () => {
      cancel = true
    }
  }, [pathname, forcar])

  const { minhaVez, abrir, fechar: liberarFila } = useFilaDePopups('tarefix-lancamento', quer)

  useEffect(() => {
    if (!minhaVez || aberto) return
    const t = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(CHAVE_SESSAO, '1')
      } catch {
        /* segue */
      }
      setAberto(true)
      abrir()
    }, 900)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minhaVez, aberto])

  useEffect(() => {
    if (!aberto || passos) return
    fecharRef.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && sair(2)
    window.addEventListener('keydown', tecla)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', tecla)
      document.body.style.overflow = antes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, passos])

  function sair(dias: number | null) {
    if (dias !== null && !forcar) adiar(dias)
    setAberto(false)
    setPassos(false)
    setQuer(false)
    liberarFila()
  }

  if (!aberto) return null

  const botaoComprar = (
    <Link
      href="/dashboard/tarefix#comprar"
      onClick={() => sair(null)}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#5B3DF5] px-4 text-sm font-black uppercase tracking-[0.05em] text-white shadow-[0_12px_30px_rgba(91,61,245,.35)] transition hover:brightness-110 active:scale-[.99]"
    >
      Quero o Tarefix por R$ 47
    </Link>
  )

  if (passos) return <TarefixApresentacao aberto aoFechar={() => sair(2)} rodape={botaoComprar} />

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-tarefix-titulo"
      onClick={() => sair(2)}
    >
      <div
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-[#5B3DF5]/40 bg-[#13111f] shadow-[0_-18px_50px_rgba(0,0,0,.5)] sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <button
          ref={fecharRef}
          type="button"
          onClick={() => sair(2)}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 transition hover:bg-black/70 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-[radial-gradient(circle_at_top_right,rgba(91,61,245,0.45),transparent_55%)] p-5 pb-4 sm:p-7 sm:pb-5">
          <div className="flex items-center gap-3">
            <Logo className="text-3xl" claro />
            <span className="rounded-full bg-[#5B3DF5] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">Novo</span>
          </div>
          <h2 id="popup-tarefix-titulo" className="mt-4 font-serif text-[26px] leading-tight text-white sm:text-3xl">
            Pare de cobrar a equipe no grupo do WhatsApp
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-white/70">
            Você monta a rotina da barbearia uma vez. O Tarefix lembra cada colaborador na hora certa, recebe a prova e mostra para você quem cumpriu.
          </p>

          <ul className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            {GANHOS.map(([icone, titulo, texto]) => (
              <li key={titulo} className="flex gap-3">
                <span className="text-lg" aria-hidden>
                  {icone}
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{titulo}</span>
                  <span className="block text-[13px] leading-snug text-white/60">{texto}</span>
                </span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={() => setPassos(true)} className="mt-3 w-full rounded-xl border border-white/15 py-3 text-sm font-bold text-white transition hover:bg-white/10">
            ▶ Ver como funciona (1 minuto)
          </button>
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-[#13111f]/95 px-5 py-3 backdrop-blur sm:px-7 sm:py-4">
          <div className="mb-2.5 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-white">R$ 47</span>
            <span className="text-xs font-semibold text-white/50">pagamento único, sem mensalidade</span>
          </div>
          {botaoComprar}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button type="button" onClick={() => sair(2)} className="min-h-[40px] px-1 text-xs font-bold text-white/45 transition hover:text-white/75">
              Agora não
            </button>
            <button type="button" onClick={() => sair(30)} className="min-h-[40px] px-1 text-xs font-bold text-white/30 transition hover:text-white/60">
              Não tenho interesse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
