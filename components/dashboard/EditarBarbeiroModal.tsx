'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { atualizarBarbeiro } from '@/app/dashboard/actions'
import { uploadFoto } from '@/lib/uploadFoto'
import type { Barbeiro } from '@/types/database'

interface Props {
  barbeiro: Barbeiro
}

export default function EditarBarbeiroModal({ barbeiro }: Props) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(barbeiro.nome)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(barbeiro.foto_url)
  const fotoRef = useRef<HTMLInputElement>(null)
  const novaFotoRef = useRef<File | null>(null)

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      novaFotoRef.current = file
      setPreview(URL.createObjectURL(file))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    startTransition(async () => {
      try {
        let foto_url = preview === barbeiro.foto_url ? barbeiro.foto_url : null
        if (novaFotoRef.current) {
          foto_url = await uploadFoto(novaFotoRef.current, 'barbeiros')
        }

        const fd = new FormData()
        fd.set('id', barbeiro.id)
        fd.set('nome', nome)
        if (foto_url) fd.set('foto_url', foto_url)

        const res = await atualizarBarbeiro(fd)
        if (res && 'error' in res) {
          setErro(res.error ?? null)
        } else {
          setOpen(false)
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-text-muted hover:text-primary transition-colors px-1"
        title="Editar barbeiro"
      >
        ✏️
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="card p-5 sm:p-6 w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg sm:text-xl text-text">Editar barbeiro</h3>
          <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text text-2xl leading-none p-1" aria-label="Fechar">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="w-20 h-20 rounded-full bg-surface-2 border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
            >
              {preview ? (
                <Image src={preview} alt={barbeiro.nome} width={80} height={80} className="w-full h-full object-cover rounded-full" unoptimized />
              ) : (
                <span className="text-text-muted text-xs text-center leading-tight px-2">+ Foto</span>
              )}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            <p className="text-text-muted text-xs">Clique para trocar a foto</p>
          </div>
          <div>
            <label className="label">Nome</label>
            <input
              type="text" value={nome} onChange={e => setNome(e.target.value)}
              required className="input w-full"
            />
          </div>
          {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-sm py-2.5">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary text-sm py-2.5">
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
