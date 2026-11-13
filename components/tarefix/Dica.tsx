'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * Dica "ⓘ": passa o mouse (computador) ou toca (celular) e aparece a explicação
 * com um exemplo real. Fica por cima de tudo (inclusive de modais) e nunca sai
 * da tela: se não couber em cima, abre embaixo.
 */
export function Dica({
  children,
  dica,
  exemplo,
  titulo,
  className = '',
}: {
  children?: React.ReactNode
  /** O mesmo que children (para espalhar os textos de DICAS). */
  dica?: React.ReactNode
  exemplo?: React.ReactNode
  titulo?: string
  className?: string
}) {
  const [aberta, setAberta] = useState(false)
  const [fixada, setFixada] = useState(false) // aberta por toque/clique: só fecha tocando fora
  const [pos, setPos] = useState<{ top: number; left: number; seta: number; embaixo: boolean } | null>(null)
  const botao = useRef<HTMLButtonElement>(null)
  const caixa = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const id = useId()

  const posicionar = useCallback(() => {
    const b = botao.current?.getBoundingClientRect()
    const c = caixa.current
    if (!b || !c) return
    const largura = c.offsetWidth
    const altura = c.offsetHeight
    const margem = 12
    const centro = b.left + b.width / 2
    const left = Math.min(Math.max(margem, centro - largura / 2), window.innerWidth - largura - margem)
    const embaixo = b.top - altura - 10 < margem
    const top = embaixo ? b.bottom + 10 : b.top - altura - 10
    setPos({ top, left, seta: Math.min(Math.max(16, centro - left), largura - 16), embaixo })
  }, [])

  useEffect(() => {
    if (!aberta) return setPos(null)
    posicionar()
    const fechar = (e: Event) => {
      if (botao.current?.contains(e.target as Node) || caixa.current?.contains(e.target as Node)) return
      setAberta(false)
      setFixada(false)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberta(false)
        setFixada(false)
      }
    }
    window.addEventListener('resize', posicionar)
    window.addEventListener('scroll', posicionar, true)
    document.addEventListener('pointerdown', fechar)
    document.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('resize', posicionar)
      window.removeEventListener('scroll', posicionar, true)
      document.removeEventListener('pointerdown', fechar)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberta, posicionar])

  const entrar = () => {
    clearTimeout(timer.current)
    setAberta(true)
  }
  const sair = () => {
    if (fixada) return
    timer.current = setTimeout(() => setAberta(false), 120)
  }

  return (
    <>
      <button
        ref={botao}
        type="button"
        aria-label={titulo ? `Dica: ${titulo}` : 'Dica'}
        aria-describedby={aberta ? id : undefined}
        aria-expanded={aberta}
        className={`relative inline-flex h-5 w-5 shrink-0 translate-y-[-1px] items-center justify-center rounded-full border border-current align-middle text-[11px] font-black leading-none text-tf-suave opacity-80 transition hover:text-tf-marca-texto hover:opacity-100 focus-visible:text-tf-marca-texto focus-visible:opacity-100 before:absolute before:-inset-3 before:content-[''] ${className}`}
        onPointerEnter={(e) => e.pointerType === 'mouse' && entrar()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && sair()}
        onFocus={entrar}
        onBlur={sair}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (fixada) {
            setFixada(false)
            setAberta(false)
          } else {
            setFixada(true)
            setAberta(true)
          }
        }}
      >
        ?
      </button>
      {aberta && (
        <div
          ref={caixa}
          id={id}
          role="tooltip"
          onPointerEnter={(e) => e.pointerType === 'mouse' && entrar()}
          onPointerLeave={(e) => e.pointerType === 'mouse' && sair()}
          className="fixed z-[90] w-[min(20rem,calc(100vw-24px))] rounded-2xl border border-tf-borda bg-tf-card p-4 text-left text-sm font-normal normal-case leading-relaxed tracking-normal text-tf-texto shadow-2xl"
          style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
        >
          {titulo && <p className="mb-1 font-extrabold">{titulo}</p>}
          <div className="space-y-2">{children ?? dica}</div>
          {exemplo && (
            <div className="mt-3 rounded-xl bg-tf-marca-clara px-3 py-2 text-tf-texto">
              <span className="font-extrabold text-tf-marca-texto">Exemplo: </span>
              {exemplo}
            </div>
          )}
          {pos && (
            <span
              aria-hidden
              className={`absolute h-3 w-3 rotate-45 border-tf-borda bg-tf-card ${pos.embaixo ? '-top-1.5 border-l border-t' : '-bottom-1.5 border-b border-r'}`}
              style={{ left: pos.seta - 6 }}
            />
          )}
        </div>
      )}
    </>
  )
}
