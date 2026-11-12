'use client'

import { useState, useTransition } from 'react'
import { Logo } from '@/components/tarefix/Logo'
import { Avatar } from '@/components/tarefix/ui'
import { entrarComPin } from './acoes'

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export function TelaPin({ token, nome, fotoUrl, empresa }: { token: string; nome: string; fotoUrl: string | null; empresa: string }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  function enviar(valor: string) {
    setErro(null)
    iniciar(async () => {
      const r = await entrarComPin(token, valor)
      if (r.ok) {
        window.location.reload()
      } else {
        setErro(r.erro)
        setPin('')
      }
    })
  }

  function tecla(t: string) {
    if (pendente) return
    if (t === '⌫') return setPin((p) => p.slice(0, -1))
    if (!t || pin.length >= 4) return
    const novo = pin + t
    setPin(novo)
    if (novo.length === 4) enviar(novo)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 py-10">
      <Logo className="text-3xl" />
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar nome={nome} url={fotoUrl} tamanho={80} />
        <h1 className="text-2xl font-extrabold">Oi, {nome.split(' ')[0]}!</h1>
        <p className="text-tf-suave">Digite seu PIN de 4 números para ver suas tarefas na {empresa}.</p>
      </div>

      <div className="flex gap-4" aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-5 w-5 rounded-full transition ${i < pin.length ? 'bg-tf-marca' : 'border-2 border-tf-borda'}`} />
        ))}
      </div>

      <p role="alert" className="min-h-[24px] text-center font-bold">
        {pendente ? 'Conferindo…' : erro}
      </p>

      <div className="grid w-full grid-cols-3 gap-3">
        {TECLAS.map((t, i) =>
          t ? (
            <button
              key={i}
              type="button"
              onClick={() => tecla(t)}
              disabled={pendente}
              aria-label={t === '⌫' ? 'Apagar' : t}
              className="h-16 rounded-2xl bg-tf-card text-2xl font-extrabold transition active:scale-95 active:bg-tf-marca-clara disabled:opacity-50"
            >
              {t}
            </button>
          ) : (
            <span key={i} />
          )
        )}
      </div>
      <p className="text-center text-sm text-tf-suave">Não sabe o PIN? Peça para quem cuida da equipe.</p>
    </main>
  )
}
