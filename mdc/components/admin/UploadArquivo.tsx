'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Sobe PDF para o bucket privado "conteudo" e devolve o caminho. */
export default function UploadArquivo({ valor, onChange, pasta }: { valor: string; onChange: (path: string) => void; pasta: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(f: File) {
    if (f.size > 50 * 1024 * 1024) return setErro('Máximo 50 MB.')
    setErro('')
    setEnviando(true)
    const base = f.name.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[^\w-]+/g, '-').slice(0, 60)
    const ext = (f.name.split('.').pop() || 'pdf').toLowerCase()
    const path = `${pasta}/${Date.now()}-${base}.${ext}`
    const { error } = await createClient().storage.from('mdc-conteudo').upload(path, f, { contentType: f.type || 'application/pdf' })
    setEnviando(false)
    if (error) return setErro(error.message)
    onChange(path)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={input} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
      <button type="button" onClick={() => input.current?.click()} className="btn-sm border border-linha" disabled={enviando}>
        {enviando ? 'Enviando...' : valor ? 'Trocar arquivo' : 'Enviar PDF'}
      </button>
      {valor && <span className="break-all text-sm text-ok">✓ {valor.split('/').pop()}</span>}
      {erro && <span className="erro">{erro}</span>}
    </div>
  )
}
