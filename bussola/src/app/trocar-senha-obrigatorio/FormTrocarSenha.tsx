'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Check } from 'lucide-react'

interface Props {
  email: string
  userId: string
}

function forca(senha: string): { nivel: 'fraca' | 'média' | 'forte'; cor: string } {
  if (senha.length < 8) return { nivel: 'fraca', cor: 'bg-red-500' }
  let pontos = 0
  if (senha.length >= 10) pontos++
  if (/[A-Z]/.test(senha)) pontos++
  if (/[0-9]/.test(senha)) pontos++
  if (/[^A-Za-z0-9]/.test(senha)) pontos++
  if (pontos >= 3) return { nivel: 'forte', cor: 'bg-verde-musgo' }
  if (pontos >= 1) return { nivel: 'média', cor: 'bg-yellow-500' }
  return { nivel: 'fraca', cor: 'bg-red-500' }
}

export function FormTrocarSenha({ email }: Props) {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const temNumero = /[0-9]/.test(senha)
  const longoSuficiente = senha.length >= 8
  const conferem = senha.length > 0 && senha === confirmar
  const podeEnviar = longoSuficiente && temNumero && conferem && !pending
  const f = forca(senha)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    startTransition(async () => {
      try {
        // 1) Atualiza senha via Supabase client (sessão atual válida)
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // updateUser do client só consegue mudar password do próprio user
        // (sessão atual). app_metadata precisa de admin → endpoint server.
        const { error: updErr } = await supabase.auth.updateUser({ password: senha })
        if (updErr) {
          setErro('Não conseguimos atualizar sua senha. Tenta de novo.')
          return
        }

        // 2) Marca senha_definida=true e limpa senha_temporaria via endpoint
        const res = await fetch('/api/auth/marcar-senha-definida', { method: 'POST' })
        if (!res.ok) {
          setErro('Senha trocada, mas algo deu errado. Faça login novamente.')
          await supabase.auth.signOut()
          router.replace('/entrar')
          return
        }

        // 3) Vai pro onboarding (ou painel se já tem estabelecimento)
        router.replace('/painel')
        router.refresh()
      } catch {
        setErro('Erro inesperado. Tenta de novo.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-areia flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto" />
        </div>

        <div className="card p-6 sm:p-8 space-y-5">
          <header className="space-y-2">
            <h1 className="font-serif text-3xl text-preto leading-tight">
              Crie sua senha definitiva
            </h1>
            <p className="text-grafite text-sm leading-relaxed">
              Pra começar a usar a Bússola, defina uma senha pessoal. Essa vai
              substituir a temporária que você acabou de usar.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email-display">Email</label>
              <input
                id="email-display"
                type="email"
                value={email}
                disabled
                className="input bg-linho/50 text-chumbo"
              />
            </div>

            <div>
              <label className="label" htmlFor="senha">Nova senha</label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrar ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres + 1 número"
                  className="input pr-11"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chumbo hover:text-marrom"
                  aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrar ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                </button>
              </div>

              {senha.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-1.5 rounded-full bg-linho overflow-hidden">
                    <div
                      className={`h-full ${f.cor} transition-all`}
                      style={{
                        width: f.nivel === 'fraca' ? '33%' : f.nivel === 'média' ? '66%' : '100%',
                      }}
                    />
                  </div>
                  <p className="text-xs text-chumbo">
                    Força: <span className="font-medium capitalize">{f.nivel}</span>
                  </p>
                </div>
              )}

              <ul className="text-xs mt-2 space-y-1">
                <li className={longoSuficiente ? 'text-verde-musgo' : 'text-chumbo'}>
                  {longoSuficiente ? '✓' : '○'} Pelo menos 8 caracteres
                </li>
                <li className={temNumero ? 'text-verde-musgo' : 'text-chumbo'}>
                  {temNumero ? '✓' : '○'} Pelo menos 1 número
                </li>
              </ul>
            </div>

            <div>
              <label className="label" htmlFor="confirmar">Confirmar senha</label>
              <input
                id="confirmar"
                type={mostrar ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Digite a senha de novo"
                className="input"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
              {confirmar.length > 0 && senha !== confirmar && (
                <p className="text-xs text-red-700 mt-1">As senhas não conferem.</p>
              )}
            </div>

            {erro && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2.5">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={!podeEnviar}
              className="btn-primary w-full text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {pending ? 'Salvando...' : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  Salvar e entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
