'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { uploadFoto } from '@/lib/uploadFoto'
import { adicionarBarbeiroConfig, desativarBarbeiroConfig, reativarBarbeiroConfig } from './actions'
import type { Barbeiro } from '@/types/database'

interface Props {
  barbeiros: Barbeiro[]
  isAutonomo?: boolean
}

export default function EquipeTab({ barbeiros: inicial, isAutonomo = false }: Props) {
  const [lista, setLista] = useState(inicial)
  const [novoNome, setNovoNome] = useState('')
  const [novoTipo, setNovoTipo] = useState<'barbeiro' | 'recepcionista'>('barbeiro')
  const [novaFotoUrl, setNovaFotoUrl] = useState<string | null>(null)
  const [novaFotoPreview, setNovaFotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fotoRef = useRef<HTMLInputElement>(null)

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFoto(file, 'barbeiros')
      setNovaFotoUrl(url)
      setNovaFotoPreview(URL.createObjectURL(file))
    } catch { /* silently fail */ }
    finally { setUploading(false) }
  }

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData()
    formData.set('nome', novoNome)
    formData.set('tipo', novoTipo)
    if (novaFotoUrl) formData.set('foto_url', novaFotoUrl)
    startTransition(async () => {
      const result = await adicionarBarbeiroConfig(formData)
      if (result?.error) { setErro(result.error); return }
      setNovoNome(''); setNovaFotoUrl(null); setNovaFotoPreview(null); setMostrarForm(false)
    })
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    startTransition(async () => {
      await (ativo ? desativarBarbeiroConfig(id) : reativarBarbeiroConfig(id))
      setLista(prev => prev.map(b => b.id === id ? { ...b, ativo: !ativo } : b))
    })
  }

  const ativos = lista.filter(b => b.ativo)
  const inativos = lista.filter(b => !b.ativo)

  return (
    <div className="space-y-6">
      {/* Lista */}
      <div className="space-y-2">
        {ativos.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-border flex items-center justify-center">
              {b.foto_url ? (
                <Image src={b.foto_url} alt={b.nome} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-text-muted">{b.nome[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans text-text truncate">{b.nome}</p>
              <p className="text-xs font-sans text-text-muted capitalize">{b.tipo}</p>
            </div>
            <button
              onClick={() => handleToggleAtivo(b.id, b.ativo)}
              disabled={isPending}
              className="text-xs text-text-muted hover:text-red-400 font-sans transition-colors"
            >
              Desativar
            </button>
          </div>
        ))}

        {inativos.length > 0 && (
          <>
            <p className="text-xs text-text-muted font-sans pt-2">Inativos</p>
            {inativos.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/50 border border-border/50 opacity-60">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-border flex items-center justify-center">
                  <span className="text-sm font-semibold text-text-muted">{b.nome[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-sans text-text">{b.nome}</p>
                </div>
                <button
                  onClick={() => handleToggleAtivo(b.id, b.ativo)}
                  disabled={isPending}
                  className="text-xs text-primary hover:text-primary/70 font-sans transition-colors"
                >
                  Reativar
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Form adicionar (oculto em modo autônomo — barbeiro único) */}
      {isAutonomo ? null : mostrarForm ? (
        <form onSubmit={handleAdicionar} className="p-4 rounded-xl border border-border bg-surface-2 space-y-4">
          <p className="text-sm font-semibold font-sans text-text">Novo membro</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fotoRef.current?.click()}
              className="w-12 h-12 rounded-xl border border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors flex-shrink-0">
              {novaFotoPreview ? (
                <Image src={novaFotoPreview} alt="" width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
            <input type="text" placeholder="Nome" value={novoNome} onChange={e => setNovoNome(e.target.value)}
              required maxLength={60} className="input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            {(['barbeiro', 'recepcionista'] as const).map(t => (
              <label key={t} className={['flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-sans transition-all',
                novoTipo === t ? 'border-primary bg-primary/5 text-text' : 'border-border text-text-muted hover:border-primary/40'].join(' ')}>
                <input type="radio" checked={novoTipo === t} onChange={() => setNovoTipo(t)} className="hidden" />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
          {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className="btn-ghost text-sm flex-1">Cancelar</button>
            <button type="submit" disabled={isPending || uploading} className="btn-primary text-sm flex-1">
              {isPending ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setMostrarForm(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-muted hover:border-primary/50 hover:text-text text-sm font-sans transition-all">
          + Adicionar membro
        </button>
      )}
    </div>
  )
}
