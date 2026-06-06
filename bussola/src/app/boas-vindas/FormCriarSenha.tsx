'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, Check } from 'lucide-react'

interface Props {
  email: string
  transactionId: string
}

export function FormCriarSenha({ email, transactionId }: Props) {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const podeEnviar =
    senha.length >= 8 &&
    senha === confirmar &&
    !pending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) {
      setErro('Senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não conferem.')
      return
    }

    startTransition(async () => {
      try {
        // 1) Cria a senha via API admin
        const res = await fetch('/api/auth/criar-senha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            transaction: transactionId,
            novaSenha: senha,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          if (json.error === 'senha_ja_definida') {
            router.replace('/entrar?msg=ja_tem_senha')
            return
          }
          setErro(mensagemDeErro(json.error))
          return
        }

        // 2) Faz signIn no client com a senha que ele acabou de criar
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        })
        if (signErr) {
          setErro('Senha criada. Faça login pra continuar.')
          router.replace('/entrar')
          return
        }

        // 3) Vai pro onboarding (preenche nome empresa, setor, etc)
        router.replace('/onboarding')
      } catch {
        setErro('Erro inesperado. Tenta de novo em alguns segundos.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-areia flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-completa.svg" alt="Bússola" className="h-10 w-auto" />
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          <header className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-marrom font-semibold bg-linho px-3 py-1 rounded-full">
              <Check size={12} strokeWidth={2.5} /> Compra confirmada
            </div>
            <h1 className="font-serif text-3xl text-preto leading-tight">
              Bem-vindo à Bússola!
            </h1>
            <p className="text-grafite text-sm leading-relaxed">
              Agora crie sua senha de acesso pra entrar no sistema.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email-display">Email da compra</label>
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
                  placeholder="Mínimo 8 caracteres"
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
              className="btn-primary w-full text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Criando...' : 'Criar senha e acessar a Bússola'}
            </button>

            <p className="text-xs text-center text-chumbo">
              Você vai entrar direto no sistema, sem precisar verificar email.
            </p>
          </form>
        </div>

        <p className="text-xs text-center text-chumbo mt-6">
          Problema com seu acesso? Fale com Carlos no WhatsApp.
        </p>
      </div>
    </main>
  )
}

function mensagemDeErro(code?: string): string {
  switch (code) {
    case 'senha_curta':
      return 'Senha precisa ter pelo menos 8 caracteres.'
    case 'senha_longa':
      return 'Senha muito longa (máximo 72 caracteres).'
    case 'compra_invalida':
      return 'Não conseguimos validar sua compra. Fale com o suporte.'
    case 'usuario_nao_encontrado':
      return 'Conta não encontrada. Fale com o suporte.'
    default:
      return 'Não conseguimos criar sua senha. Tenta de novo em alguns segundos.'
  }
}
