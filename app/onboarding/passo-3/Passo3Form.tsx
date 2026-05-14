'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { uploadFoto } from '@/lib/uploadFoto'
import { finalizarOnboarding } from './actions'

interface BarbeiroLocal {
  id: string
  nome: string
  fotoPreview: string | null
  fotoUrl: string | null
  uploading: boolean
}

function novoBarb(): BarbeiroLocal {
  return { id: crypto.randomUUID(), nome: '', fotoPreview: null, fotoUrl: null, uploading: false }
}

export default function Passo3Form() {
  const [barbeiros, setBarbeiros] = useState<BarbeiroLocal[]>([novoBarb()])
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fotoRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function setField(id: string, field: Partial<BarbeiroLocal>) {
    setBarbeiros(prev => prev.map(b => b.id === id ? { ...b, ...field } : b))
  }

  async function handleFoto(id: string, file: File) {
    if (file.size > 2 * 1024 * 1024) { setErro('Foto deve ter no máximo 2MB.'); return }
    setField(id, { fotoPreview: URL.createObjectURL(file), uploading: true })
    try {
      const url = await uploadFoto(file, 'barbeiros')
      setField(id, { fotoUrl: url, uploading: false })
    } catch {
      setField(id, { uploading: false })
    }
  }

  function adicionar() {
    if (barbeiros.length >= 20) return
    setBarbeiros(prev => [...prev, novoBarb()])
  }

  function remover(id: string) {
    if (barbeiros.length <= 1) return
    setBarbeiros(prev => prev.filter(b => b.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const validos = barbeiros.filter(b => b.nome.trim())
    if (!validos.length) { setErro('Adicione ao menos um barbeiro com nome.'); return }
    startTransition(async () => {
      const result = await finalizarOnboarding(
        validos.map(b => ({ nome: b.nome, foto_url: b.fotoUrl }))
      )
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <div className="card p-8">
      <h2 className="font-serif text-xl text-text mb-1">Equipe</h2>
      <p className="text-text-muted text-sm font-sans mb-6">
        Adicione os barbeiros da sua equipe. Você pode editar depois.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {barbeiros.map((b, i) => (
          <div key={b.id} className="flex items-start gap-3 p-4 rounded-xl bg-surface-2 border border-border">
            {/* Foto */}
            <button
              type="button"
              onClick={() => fotoRefs.current[b.id]?.click()}
              className="w-12 h-12 rounded-xl border border-border overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              {b.fotoPreview ? (
                <Image src={b.fotoPreview} alt="" width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
            <input
              ref={el => { fotoRefs.current[b.id] = el }}
              type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFoto(b.id, f) }}
            />

            {/* Nome */}
            <div className="flex-1">
              <input
                type="text"
                placeholder={`Barbeiro ${i + 1}`}
                value={b.nome}
                onChange={e => setField(b.id, { nome: e.target.value })}
                className="input text-sm"
                maxLength={60}
              />
            </div>

            {/* Remover */}
            {barbeiros.length > 1 && (
              <button
                type="button" onClick={() => remover(b.id)}
                className="text-text-muted hover:text-red-400 transition-colors mt-2.5 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {barbeiros.length < 20 && (
          <button
            type="button" onClick={adicionar}
            className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-muted hover:border-primary/50 hover:text-text text-sm font-sans transition-all"
          >
            + Adicionar barbeiro
          </button>
        )}

        {erro && <p className="text-red-400 text-sm font-sans text-center">{erro}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/onboarding/passo-2" className="btn-ghost flex-1 text-center text-sm">
            ← Voltar
          </Link>
          <button
            type="submit"
            disabled={isPending || barbeiros.some(b => b.uploading)}
            className="btn-primary flex-1"
          >
            {isPending ? 'Finalizando…' : 'Finalizar →'}
          </button>
        </div>
      </form>
    </div>
  )
}
