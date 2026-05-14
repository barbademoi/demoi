'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { salvarIdentidadeConfig } from './actions'

interface Props {
  barbearia: { nome: string; cidade: string | null; logo_url: string | null; cor_principal: string | null }
}

export default function IdentidadeTab({ barbearia }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(barbearia.logo_url)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setErro('Logo deve ter no máximo 2MB.'); e.target.value = ''; return }
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null); setSucesso(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await salvarIdentidadeConfig(formData)
      if (result?.error) setErro(result.error)
      else setSucesso(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nome" className="label">Nome da barbearia *</label>
        <input id="nome" name="nome" type="text" required maxLength={60}
          defaultValue={barbearia.nome} className="input" />
      </div>

      <div>
        <label htmlFor="cidade" className="label">Cidade / Estado *</label>
        <input id="cidade" name="cidade" type="text" required
          defaultValue={barbearia.cidade ?? ''} placeholder="Ex: São Paulo, SP" className="input" />
      </div>

      <div>
        <label className="label">Logo</label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => logoInputRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo" width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <p className="text-xs text-text-muted font-sans">PNG, JPG ou SVG · Máx. 2MB</p>
        </div>
        <input ref={logoInputRef} name="logo" type="file"
          accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoChange} className="hidden" />
      </div>

      <div>
        <label htmlFor="cor_principal" className="label">Cor principal</label>
        <div className="flex items-center gap-3">
          <input id="cor_principal" name="cor_principal" type="color"
            defaultValue={barbearia.cor_principal ?? '#2563EB'}
            className="w-10 h-10 rounded-lg border border-border bg-surface-2 cursor-pointer p-0.5" />
          <span className="text-text-muted text-xs font-sans">Destaques do sistema</span>
        </div>
      </div>

      {erro && <p className="text-red-400 text-sm font-sans">{erro}</p>}
      {sucesso && <p className="text-green-400 text-sm font-sans">Salvo com sucesso!</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  )
}
