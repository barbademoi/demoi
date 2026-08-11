'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  adiarPopupBrindoleta,
  recusarPopupBrindoleta,
  registrarExibicaoPopup,
} from '@/app/dashboard/brindoleta/popup-actions'

/**
 * POPUP DE OFERTA DA BRINDOLETA.
 *
 * Só é montado pra quem NÃO tem a Brindoleta — o servidor já decidiu isso com
 * `brindoleta_popup_deve_aparecer()`. Aqui só resta a regra de sessão e a
 * educação: X grande, Esc, clique fora, e um "não tenho interesse" que é
 * respeitado de verdade.
 *
 * A promessa de "7 dias" mora no banco (ver migration 051). O `sessionStorage`
 * daqui resolve outra coisa: não reaparecer a cada navegação DENTRO da mesma
 * sessão. São problemas diferentes — um é entre dispositivos e dias, o outro é
 * entre cliques no menu.
 */

const CHAVE_SESSAO = 'barbermeta:popup-brindoleta-visto'

type Props = {
  precoLabel: string
  midiaUrl: string | null
  midiaTipo: 'gif' | 'video' | null
  /** Avisa o pai que o popup entrou em cena, pra ele segurar o banner do topo. */
  onVisibilidade?: (visivel: boolean) => void
}

export default function BrindoletaOfertaPopup({
  precoLabel,
  midiaUrl,
  midiaTipo,
  onVisibilidade,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const [saindo, setSaindo] = useState(false)
  const fecharRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Já apareceu nesta sessão: não insiste a cada navegação.
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(CHAVE_SESSAO)) return

    // Pequeno atraso pra não competir com o carregamento do painel — o popup
    // não pode ser a primeira coisa a disputar a tela.
    const t = window.setTimeout(() => {
      window.sessionStorage.setItem(CHAVE_SESSAO, '1')
      setAberto(true)
      onVisibilidade?.(true)
      registrarExibicaoPopup().catch(() => {})
    }, 700)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Foco no botão de fechar: quem usa teclado precisa alcançar a saída primeiro.
  useEffect(() => {
    if (aberto) fecharRef.current?.focus()
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    // Trava o scroll do fundo só enquanto está aberto, e devolve ao sair.
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto])

  function encerrar() {
    setSaindo(true)
    window.setTimeout(() => {
      setAberto(false)
      onVisibilidade?.(false)
    }, 160)
  }

  function fechar() {
    encerrar()
    adiarPopupBrindoleta().catch(() => {})
  }

  function recusar() {
    encerrar()
    recusarPopupBrindoleta().catch(() => {})
  }

  if (!aberto) return null

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm transition-opacity duration-150 sm:items-center sm:p-4 ${
        saindo ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-brindoleta-titulo"
      onClick={fechar}
    >
      <div
        // No celular vira uma folha de baixo pra cima, com altura limitada:
        // cobrir a tela inteira sem saída visível é o que transforma oferta
        // em armadilha.
        className={`relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-[#d8ff00]/20 bg-[#12140f] shadow-[0_-18px_50px_rgba(0,0,0,.5)] transition-transform duration-150 sm:max-w-lg sm:rounded-3xl sm:shadow-[0_24px_60px_rgba(0,0,0,.5)] ${
          saindo ? 'translate-y-3' : 'translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Alça visual do bottom sheet, só no mobile. */}
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />

        {/* X grande: 44px de alvo, sempre visível por cima da mídia. */}
        <button
          ref={fecharRef}
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Demonstração */}
        {/* Altura fixa e contida nas duas telas. Em proporção 16/10 a
            demonstração chegava a 320px no desktop e 244px no celular, e
            empurrava a lista do que está incluso pra fora da vista — a pessoa
            via o vídeo e não via a oferta. */}
        <div className="relative h-36 w-full overflow-hidden bg-[#1a1d16] sm:h-56 sm:rounded-t-3xl">
          {midiaUrl && midiaTipo === 'video' ? (
            <video
              src={midiaUrl}
              autoPlay muted loop playsInline preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : midiaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={midiaUrl} alt="Brindoleta em funcionamento" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            // Placeholder: o popup precisa funcionar antes do vídeo existir.
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_35%,rgba(216,255,0,.10),transparent_60%)]">
              <span className="text-4xl" aria-hidden>🎡</span>
              <p className="px-6 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#d8ff00]/70">
                Demonstração em breve
              </p>
            </div>
          )}
        </div>

        <div className="p-4 pb-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8ff00]">Novo no seu BarberMeta</p>
          <h2 id="popup-brindoleta-titulo" className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
            Faça o cliente voltar levando um brinde
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-white/65">
            O cliente escaneia o QR Code do barbeiro, gira a roleta e ganha uma oferta na hora.
            Você escolhe os prêmios, e cada venda gerada aparece no seu painel com o nome de quem atendeu.
          </p>

          <ul className="mt-3.5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 text-sm leading-relaxed text-white/80">
            {[
              'Até 6 ofertas entre serviços, produtos e brindes',
              'Um QR Code por barbeiro, pra saber quem gerou cada venda',
              'Painel de vendas e as ofertas que mais convertem',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="text-[#d8ff00]" aria-hidden>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

        </div>

        {/* Preço e botão GRUDADOS no rodapé do sheet. Em telas baixas (360x640)
            eles caíam abaixo da dobra, e uma oferta que exige rolar pra ser
            vista não cumpre o papel. Assim ficam à vista em qualquer altura,
            e o conteúdo rola por baixo. */}
        <div className="sticky bottom-0 border-t border-white/10 bg-[#12140f]/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl text-white sm:text-3xl">{precoLabel}</span>
            <span className="text-[11px] font-semibold text-white/50 sm:text-xs">pagamento único, sem mensalidade</span>
          </div>
          <Link
            href="/dashboard/brindoleta#comprar"
            onClick={fechar}
            className="mt-2.5 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#d8ff00] px-4 text-sm font-black uppercase tracking-[0.05em] text-[#11130f] shadow-[0_12px_30px_rgba(216,255,0,.15)] transition hover:brightness-105 active:scale-[.99]"
          >
            Quero ativar a Brindoleta
          </Link>

          {/* As duas saídas moram AQUI, e não no corpo que rola: quando ficavam
              lá em cima, "não tenho interesse" só aparecia pra quem rolasse até
              ele. Recusar a oferta não pode dar mais trabalho que aceitá-la. */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={fechar}
              className="min-h-[40px] px-1 text-xs font-bold text-white/45 transition hover:text-white/75"
            >
              Agora não
            </button>
            <button
              type="button"
              onClick={recusar}
              className="min-h-[40px] px-1 text-xs font-bold text-white/30 transition hover:text-white/60"
            >
              Não tenho interesse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
