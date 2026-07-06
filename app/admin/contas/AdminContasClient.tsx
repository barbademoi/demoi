'use client'

import { useState, useTransition } from 'react'
import { criarContaManual } from './actions'

type CriarContaResult = Awaited<ReturnType<typeof criarContaManual>>

const VAZIO = { email: '', nome_barbearia: '', senha: '123456' }

export default function AdminContasClient() {
  const [dados, setDados] = useState({ ...VAZIO })
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<CriarContaResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await criarContaManual(formData)
      if (result?.error) { setErro(result.error); return }
      setSucesso(result)
      setDados({ ...VAZIO })
    })
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="mb-8">
          <h1 className="font-serif text-2xl text-text">Contas</h1>
          <p className="text-text-muted text-sm font-sans mt-0.5">
            Admin — criar acesso manual (sem passar pela compra)
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="email" className="label">Email do dono *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={dados.email}
                onChange={e => setDados(p => ({ ...p, email: e.target.value }))}
                placeholder="dono@barbearia.com"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="nome_barbearia" className="label">Nome da barbearia *</label>
              <input
                id="nome_barbearia"
                name="nome_barbearia"
                type="text"
                required
                value={dados.nome_barbearia}
                onChange={e => setDados(p => ({ ...p, nome_barbearia: e.target.value }))}
                placeholder="Ex: Club7 Barbershop"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="senha" className="label">Senha temporária</label>
              <input
                id="senha"
                name="senha"
                type="text"
                value={dados.senha}
                onChange={e => setDados(p => ({ ...p, senha: e.target.value }))}
                placeholder="123456"
                className="input font-mono"
              />
              <p className="text-xs text-text-muted font-sans mt-1">
                No primeiro login o dono é obrigado a trocar essa senha e depois faz o onboarding.
              </p>
            </div>

            {erro && (
              <p className="text-red-400 text-sm font-sans text-center">{erro}</p>
            )}

            {sucesso?.ok && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm font-sans">
                <p className="text-green-400 font-semibold mb-1">Conta criada! ✅</p>
                {sucesso.detalhe && (
                  <p className="text-text-muted text-xs leading-relaxed">
                    <span className="text-text">{sucesso.detalhe.email}</span> vinculado à barbearia{' '}
                    <span className="text-text">{sucesso.detalhe.barbearia}</span>. Já pode fazer login com a senha temporária.
                  </p>
                )}
                {sucesso.aviso && (
                  <p className="text-yellow-400 text-xs mt-2">{sucesso.aviso}</p>
                )}
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Criando…' : 'Criar acesso'}
            </button>

          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 font-sans leading-relaxed">
          Se o email já existir no Auth (ex.: criado à mão no painel do Supabase),
          a conta é reaproveitada e a senha é resetada para a temporária.
        </p>

      </div>
    </main>
  )
}
