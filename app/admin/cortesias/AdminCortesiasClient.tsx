'use client'

import { useState, useTransition } from 'react'
import { concederAcesso, listarCortesias, type Cortesia } from './actions'

function formatarData(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso))
  } catch { return '—' }
}

export default function AdminCortesiasClient({ cortesiasIniciais }: { cortesiasIniciais: Cortesia[] }) {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<{ email: string; jaExistia: boolean } | null>(null)
  const [cortesias, setCortesias] = useState<Cortesia[]>(cortesiasIniciais)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await concederAcesso(formData)
      if (result?.error) { setErro(result.error); return }
      setSucesso({ email: result.detalhe?.email ?? email, jaExistia: !!result.jaExistia })
      setEmail('')
      const { cortesias: lista } = await listarCortesias()
      setCortesias(lista)
    })
  }

  return (
    <main className="bm-theme min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="mb-8">
          <h1 className="font-serif text-2xl text-text">Conceder acesso</h1>
          <p className="text-text-muted text-sm font-sans mt-0.5">
            Cortesia vitalícia — acesso permanente, sem venda e fora da régua de assinatura.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">E-mail da pessoa *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pessoa@email.com"
                className="input"
              />
            </div>

            {erro && <p className="text-red-400 text-sm font-sans text-center">{erro}</p>}

            {sucesso && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm font-sans">
                <p className="text-green-400 font-semibold mb-1">
                  {sucesso.jaExistia ? 'Conta já existia — cortesia garantida ✅' : 'Acesso de cortesia concedido ✅'}
                </p>
                <p className="text-text-muted text-xs leading-relaxed">
                  <span className="text-text">{sucesso.email}</span> agora tem acesso vitalício de cortesia.
                  {' '}Peça pra pessoa entrar em <span className="text-text">“Esqueci minha senha”</span> com esse
                  e-mail pra definir a senha dela e acessar.
                </p>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Concedendo…' : 'Conceder acesso'}
            </button>
          </form>
        </div>

        {/* Cortesias já concedidas */}
        <div className="mt-8">
          <h2 className="font-sans font-semibold text-text text-sm mb-3">
            Cortesias concedidas {cortesias.length > 0 && <span className="text-text-muted">({cortesias.length})</span>}
          </h2>
          {cortesias.length === 0 ? (
            <p className="text-text-muted text-xs font-sans">Nenhuma cortesia concedida ainda.</p>
          ) : (
            <ul className="card divide-y divide-border">
              {cortesias.map((c) => (
                <li key={c.email} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-sans">
                  <span className="text-text truncate">{c.email}</span>
                  <span className="text-text-muted text-xs shrink-0">{formatarData(c.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-muted text-[11px] font-sans mt-3 leading-relaxed">
            Pra revogar uma cortesia depois, é feito manualmente no Supabase (Auth → remover o usuário
            ou desvincular a conta). Aqui é só concessão e acompanhamento.
          </p>
        </div>

      </div>
    </main>
  )
}
