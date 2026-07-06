'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { criarBarbeiro } from '@/app/dashboard/actions'
import { uploadFoto } from '@/lib/uploadFoto'

interface Props {
  tipo?: 'barbeiro' | 'recepcionista'
  onCriado?: (linkCodigo: string, nome: string) => void
}

export default function NovoBarbeiroModal({ tipo = 'barbeiro', onCriado }: Props) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [dias, setDias] = useState('')
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const fotoRef = useRef<HTMLInputElement>(null)

  const labelTipo = tipo === 'recepcionista' ? 'recepcionista' : 'barbeiro'
  const labelTipoCap = tipo === 'recepcionista' ? 'Recepcionista' : 'Barbeiro'

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function fechar() {
    setOpen(false)
    setLinkGerado(null)
    setNome('')
    setDias('')
    setPreview(null)
    setErro(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    startTransition(async () => {
      try {
        let foto_url: string | null = null
        const file = fotoRef.current?.files?.[0]
        if (file) foto_url = await uploadFoto(file, 'barbeiros')

        const fd = new FormData()
        fd.set('nome', nome)
        fd.set('tipo', tipo)
        fd.set('dias_trabalho_mes', dias)
        if (foto_url) fd.set('foto_url', foto_url)

        const res = await criarBarbeiro(fd)
        if (res && 'error' in res) {
          setErro(res.error ?? null)
        } else if (res && 'link_codigo' in res) {
          setLinkGerado(res.link_codigo)
          onCriado?.(res.link_codigo, nome)
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : `Erro ao criar ${labelTipo}.`)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`text-sm py-2 px-4 ${tipo === 'recepcionista' ? 'btn-ghost border border-border' : 'btn-primary'}`}
      >
        + {labelTipoCap}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-sm animate-fade-in">
        {linkGerado ? (
          <>
            <h3 className="font-serif text-xl text-text mb-2">{labelTipoCap} criado!</h3>
            <p className="text-text-muted text-sm font-sans mb-4">Envie esse link para {nome || `o ${labelTipo}`}:</p>
            <div className="bg-surface-2 border border-border rounded-xl px-4 py-3 font-sans text-sm text-primary break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/b/{linkGerado}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/b/${linkGerado}`)}
              className="btn-ghost w-full mt-3 text-sm"
            >
              Copiar link
            </button>
            <button onClick={fechar} className="btn-primary w-full mt-2 text-sm">Fechar</button>
          </>
        ) : (
          <>
            <h3 className="font-serif text-xl text-text mb-4">+ {labelTipoCap}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fotoRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-surface-2 border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden"
                >
                  {preview ? (
                    <Image src={preview} alt="preview" width={80} height={80} className="w-full h-full object-cover rounded-full" unoptimized />
                  ) : (
                    <span className="text-text-muted text-xs text-center leading-tight px-2">+ Foto</span>
                  )}
                </button>
                <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                {preview && (
                  <button type="button" onClick={() => { setPreview(null); if (fotoRef.current) fotoRef.current.value = '' }} className="text-xs text-text-muted hover:text-text">
                    Remover foto
                  </button>
                )}
              </div>
              <div>
                <label className="label">Nome</label>
                <input
                  type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder={`Nome da ${labelTipo}`} required className="input"
                />
              </div>
              {tipo !== 'recepcionista' && (
                <div>
                  <label className="label">Dias que vai trabalhar no mês</label>
                  <input
                    type="number" min="1" max="31" inputMode="numeric" placeholder="padrão da barbearia"
                    value={dias} onChange={e => setDias(e.target.value)} className="input"
                  />
                  <p className="text-text-muted text-xs font-sans mt-1">
                    Em branco: usa o padrão da barbearia. Preencha só quem folga mais.
                  </p>
                </div>
              )}
              {erro && <p className="text-red-400 text-xs font-sans">{erro}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={fechar} className="btn-ghost flex-1">Cancelar</button>
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
