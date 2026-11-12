'use client'

import { useEffect, useState } from 'react'

/**
 * Chave de tema do Tarefix: Sistema (padrão) / Claro / Escuro.
 * Salva em localStorage('tarefix-tema') e aplica em <html data-tf-tema>
 * (o ScriptTema reaplica antes da primeira pintura nas próximas visitas).
 */

export type Tema = 'sistema' | 'light' | 'dark'
const CHAVE = 'tarefix-tema'

function ler(): Tema {
  try {
    const t = localStorage.getItem(CHAVE)
    return t === 'light' || t === 'dark' ? t : 'sistema'
  } catch {
    return 'sistema'
  }
}

const EVENTO = 'tarefix-tema'

function aplicar(t: Tema) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: t }))
  try {
    if (t === 'sistema') {
      localStorage.removeItem(CHAVE)
      document.documentElement.removeAttribute('data-tf-tema')
    } else {
      localStorage.setItem(CHAVE, t)
      document.documentElement.setAttribute('data-tf-tema', t)
    }
  } catch {
    if (t === 'sistema') document.documentElement.removeAttribute('data-tf-tema')
    else document.documentElement.setAttribute('data-tf-tema', t)
  }
}

function useTema() {
  const [tema, setTema] = useState<Tema>('sistema')
  useEffect(() => {
    setTema(ler())
    // mantém seletores na mesma tela (e outras abas) em sincronia
    const aoMudar = (e: Event) => setTema((e as CustomEvent<Tema>).detail)
    const aoStorage = (e: StorageEvent) => {
      if (e.key !== CHAVE) return
      const t = ler()
      setTema(t)
      if (t === 'sistema') document.documentElement.removeAttribute('data-tf-tema')
      else document.documentElement.setAttribute('data-tf-tema', t)
    }
    window.addEventListener(EVENTO, aoMudar)
    window.addEventListener('storage', aoStorage)
    return () => {
      window.removeEventListener(EVENTO, aoMudar)
      window.removeEventListener('storage', aoStorage)
    }
  }, [])
  return [
    tema,
    (t: Tema) => {
      setTema(t)
      aplicar(t)
    },
  ] as const
}

const ICONE_SOL = 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4'
const ICONE_LUA = 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z'
const ICONE_AUTO = 'M12 3a9 9 0 100 18V3zM12 3a9 9 0 010 18'

function Icone({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

/** Seletor com três opções (para Ajustes). */
export function SeletorTema() {
  const [tema, mudar] = useTema()
  const opcoes: [Tema, string, string][] = [
    ['sistema', 'Sistema', ICONE_AUTO],
    ['light', 'Claro', ICONE_SOL],
    ['dark', 'Escuro', ICONE_LUA],
  ]
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
      {opcoes.map(([valor, rotulo, icone]) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          onClick={() => mudar(valor)}
          className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-bold transition ${
            tema === valor ? 'border-tf-marca bg-tf-marca-clara text-tf-marca-texto' : 'border-tf-borda text-tf-suave'
          }`}
        >
          <Icone d={icone} />
          {rotulo}
        </button>
      ))}
    </div>
  )
}

/** Botão compacto que alterna Sistema → Claro → Escuro (para o cabeçalho). */
export function BotaoTema() {
  const [tema, mudar] = useTema()
  const proximo: Record<Tema, Tema> = { sistema: 'light', light: 'dark', dark: 'sistema' }
  const rotulo: Record<Tema, string> = { sistema: 'Tema: automático', light: 'Tema: claro', dark: 'Tema: escuro' }
  const icone: Record<Tema, string> = { sistema: ICONE_AUTO, light: ICONE_SOL, dark: ICONE_LUA }
  return (
    <button
      type="button"
      onClick={() => mudar(proximo[tema])}
      aria-label={`${rotulo[tema]}. Tocar para trocar`}
      title={rotulo[tema]}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tf-suave transition hover:bg-tf-marca-clara"
    >
      <Icone d={icone[tema]} />
    </button>
  )
}
