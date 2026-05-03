'use client'

import { useState, useTransition } from 'react'
import { criarBarbeiro } from '@/app/dashboard/actions'

interface Props {
  onCriado?: (linkCodigo: string, nome: string) => void
}

export default function NovoBarbeiroModal({ onCriado }: Props) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await criarBarbeiro(fd)
      if (res && 'error' in res) {
        setErro(res.error ?? null)
      } else if (res && 'link_codigo' in res) {
        setLinkGerado(res.link_codigo)
        onCriado?.(res.link_codigo, nome)
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm py-2 px-4">
        + Novo barbeiro
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-sm animate-fade-in">
        {linkGerado ? (
          <>
            <h3 className="font-serif text-xl text-text mb-2">Barbeiro criado!</h3>
            <p className="text-text-muted text-sm font-sans mb-4">
              Envie esse link para {nome || 'o barbeiro'}:
            </p>
            <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 font-sans text-sm text-primary break-all">
              {typeof window !== 'undefined' ? window.location.origin : 'https://barbermeta.com.br'}/b/{linkGerado}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  `${window.location.origin}/b/${linkGerado}`
                )
              }}
              className="btn-ghost w-full mt-3 text-sm"
            >
              Copiar link
            </button>
            <button
              onClick={() => { setOpen(false); setLinkGerado(null); setNome('') }}
              className="btn-primary w-full mt-2 text-sm"
            >
              Fechar
            </button>
          </>
        ) : (
          <>
            <h3 className="font-serif text-xl text-text mb-4">Novo barbeiro</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input
                  name="nome"
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome do barbeiro"
                  required
                  className="input"
                />
              </div>
              {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1">
                  {isPending ? 'Criando…' : 'Criar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
