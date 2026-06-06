'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Copy, CheckCircle2 } from 'lucide-react'

interface Resultado {
  email: string
  senha: string
}

export function FormGerarSenha() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const copiar = async () => {
    if (!resultado) return
    try {
      await navigator.clipboard.writeText(resultado.senha)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    const emailLimpo = email.toLowerCase().trim()
    if (!emailLimpo) return

    startTransition(async () => {
      const res = await fetch('/api/auth/nova-senha-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpo }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(mensagemDeErro(json.error))
        return
      }
      setResultado({ email: emailLimpo, senha: json.senha })
    })
  }

  // Estado de sucesso — mostra a nova senha
  if (resultado) {
    return (
      <main className="min-h-screen bg-areia flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-completa.svg" alt="Bússola" className="h-12 w-auto" />
          </div>

          <div className="rounded-lg border-l-4 border-verde-musgo bg-verde-musgo/10 p-5 mb-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} strokeWidth={2} className="text-verde-musgo shrink-0" />
              <h2 className="font-semibold text-text">Nova senha gerada!</h2>
            </div>
            <p className="text-sm text-grafite leading-relaxed">
              Use a senha abaixo pra entrar. Logo depois você cria uma definitiva.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <p className="text-xs text-chumbo uppercase tracking-wider font-semibold mb-1">
                  Email
                </p>
                <p className="text-sm text-text font-mono break-all">{resultado.email}</p>
              </div>

              <div>
                <p className="text-xs text-chumbo uppercase tracking-wider font-semibold mb-1">
                  Nova senha temporária
                </p>
                <div className="flex items-stretch gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-md bg-white border border-border font-mono text-lg tracking-wider text-text select-all">
                    {resultado.senha}
                  </code>
                  <button
                    type="button"
                    onClick={copiar}
                    className="px-3 rounded-md border border-marrom/30 bg-white hover:bg-linho transition-colors text-marrom inline-flex items-center gap-1.5 text-sm font-medium"
                    aria-label="Copiar senha"
                  >
                    {copiado ? (
                      <>
                        <Check size={14} strokeWidth={2.5} />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} strokeWidth={2} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(`/entrar?email=${encodeURIComponent(resultado.email)}`)
            }
            className="btn-primary w-full text-base py-3"
          >
            Ir pra tela de login →
          </button>

          <p className="text-center text-xs text-chumbo mt-4">
            Anota a senha em algum lugar seguro antes de sair daqui.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-simbolo-transparente.svg" alt="Bússola" className="h-12 w-auto mb-3" />
          <h1 className="font-serif text-3xl text-preto mb-2">Recuperar acesso</h1>
          <p className="text-grafite text-sm text-center leading-relaxed">
            Digite seu email. Vamos gerar uma nova senha temporária pra você
            entrar.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@email.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            {erro && <p className="text-vinho text-sm text-center">{erro}</p>}

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? 'Gerando…' : 'Gerar nova senha temporária'}
            </button>
          </form>
        </div>

        <p className="text-center text-grafite text-sm mt-6">
          <Link href="/entrar" className="text-marrom font-medium hover:underline">
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  )
}

function mensagemDeErro(code?: string): string {
  switch (code) {
    case 'email_nao_encontrado':
      return 'Email não encontrado. Confira ou fale com Carlos no WhatsApp.'
    case 'conta_suspensa':
      return 'Esse acesso está suspenso. Fale com Carlos no WhatsApp.'
    default:
      return 'Não conseguimos gerar uma nova senha. Tenta de novo em alguns segundos.'
  }
}
