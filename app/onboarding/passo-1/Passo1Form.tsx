'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { salvarIdentidade } from './actions'

interface Props {
  barbearia: {
    nome: string
    cidade: string | null
    logo_url: string | null
    cor_principal: string | null
  } | null
}

export default function Passo1Form({ barbearia }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(barbearia?.logo_url ?? null)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErro('Logo deve ter no máximo 2MB.')
      e.target.value = ''
      return
    }
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await salvarIdentidade(formData)
      if (result?.error) setErro(result.error)
    })
  }

  return (
    <div className="card p-8">
      <h2 className="font-serif text-xl text-text mb-1">Identidade da barbearia</h2>
      <p className="text-text-muted text-sm font-sans mb-6">Como sua barbearia vai aparecer no sistema.</p>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

        {/* Nome */}
        <div>
          <label htmlFor="nome" className="label">Nome da barbearia *</label>
          <input
            id="nome" name="nome" type="text" required maxLength={60}
            defaultValue={barbearia?.nome ?? ''}
            placeholder="Ex: Barbearia do João"
            className="input"
          />
        </div>

        {/* Cidade */}
        <div>
          <label htmlFor="cidade" className="label">Cidade / Estado *</label>
          <input
            id="cidade" name="cidade" type="text" required
            defaultValue={barbearia?.cidade ?? ''}
            placeholder="Ex: São Paulo, SP"
            className="input"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="label">Logo (opcional)</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="Logo" width={64} height={64} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <div className="text-xs text-text-muted font-sans">
              <p>PNG, JPG ou SVG</p>
              <p>Máx. 2MB</p>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                  className="text-red-400 hover:text-red-300 mt-1"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
          <input
            ref={logoInputRef}
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleLogoChange}
            className="hidden"
          />
        </div>

        {/* Cor primária */}
        <div>
          <label htmlFor="cor_principal" className="label">Cor principal</label>
          <div className="flex items-center gap-3">
            <input
              id="cor_principal" name="cor_principal" type="color"
              defaultValue={barbearia?.cor_principal ?? '#2563EB'}
              className="w-10 h-10 rounded-lg border border-border bg-surface-2 cursor-pointer p-0.5"
            />
            <span className="text-text-muted text-xs font-sans">
              Usada nos destaques do sistema
            </span>
          </div>
        </div>

        {erro && <p className="text-red-400 text-sm font-sans text-center">{erro}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full mt-2">
          {isPending ? 'Salvando…' : 'Próximo →'}
        </button>
      </form>
    </div>
  )
}
