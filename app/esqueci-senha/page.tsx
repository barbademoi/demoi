'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { solicitarCodigo, verificarCodigo } from './actions'

type Etapa = 'email' | 'codigo'

export default function EsqueciSenhaPage() {
  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEnviarEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setInfo(null)
    const fd = new FormData(e.currentTarget)
    const emailDigitado = ((fd.get('email') as string) ?? '').toLowerCase().trim()

    startTransition(async () => {
      const result = await solicitarCodigo(fd)
      if (result?.error) {
        setErro(result.error)
        return
      }
      setEmail(emailDigitado)
      setCodigo('')
      setEtapa('codigo')
    })
  }

  function handleVerificar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setInfo(null)

    startTransition(async () => {
      const result = await verificarCodigo(email, codigo)
      if (result?.error) setErro(result.error)
    })
  }

  function handleReenviar() {
    setErro(null)
    setInfo(null)
    const fd = new FormData()
    fd.set('email', email)

    startTransition(async () => {
      const result = await solicitarCodigo(fd)
      if (result?.error) {
        setErro(result.error)
        return
      }
      setInfo('Código reenviado. Verifique seu email.')
    })
  }

  function handleTrocarEmail() {
    setEtapa('email')
    setCodigo('')
    setErro(null)
    setInfo(null)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-text mb-2">
            Barber<span className="metal-text-gold">Meta</span>
          </h1>
          <p className="text-text-muted text-sm font-sans">
            Recuperação de senha
          </p>
        </div>

        <div className="card p-8">
          {etapa === 'email' ? (
            <form onSubmit={handleEnviarEmail} className="space-y-5">
              <p className="text-text-muted text-sm font-sans leading-relaxed">
                Digite seu email cadastrado. Enviaremos um código de 8 dígitos para você.
              </p>

              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="dono@barbearia.com"
                  className="input"
                />
              </div>

              {erro && (
                <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full mt-2"
              >
                {isPending ? 'Enviando…' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerificar} className="space-y-5">
              <div className="flex items-start gap-2 text-text-muted text-sm font-sans">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>
                  Código enviado para <span className="text-text">{email}</span>
                </span>
              </div>

              <div>
                <label htmlFor="codigo" className="label">Código de 8 dígitos</label>
                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••••••"
                  className="input text-center tracking-[0.4em] text-lg font-mono"
                  autoFocus
                />
              </div>

              {erro && (
                <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
              )}
              {info && !erro && (
                <p className="text-green-400 text-sm font-sans text-center">{info}</p>
              )}

              <button
                type="submit"
                disabled={isPending || codigo.length !== 8}
                className="btn-primary w-full mt-2"
              >
                {isPending ? 'Validando…' : 'Confirmar'}
              </button>

              <div className="flex justify-between text-xs font-sans pt-2">
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={isPending}
                  className="text-text-muted hover:text-text transition-colors disabled:opacity-50"
                >
                  Não recebi
                </button>
                <button
                  type="button"
                  onClick={handleTrocarEmail}
                  disabled={isPending}
                  className="text-text-muted hover:text-text transition-colors disabled:opacity-50"
                >
                  Trocar email
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-text-muted hover:text-text text-sm font-sans transition-colors">
            ← Voltar ao login
          </Link>
        </p>

      </div>
    </main>
  )
}
