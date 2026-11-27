'use client'
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Sobe uma imagem para o bucket público e devolve a URL. */
export default function UploadImagem({ valor, onChange, pasta }: { valor: string; onChange: (url: string) => void; pasta: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(f: File) {
    if (f.size > 5 * 1024 * 1024) return setErro('Máximo 5 MB.')
    setErro('')
    setEnviando(true)
    const ext = (f.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${pasta}/${Date.now()}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('publico').upload(path, f, { contentType: f.type })
    setEnviando(false)
    if (error) return setErro(error.message)
    onChange(supabase.storage.from('publico').getPublicUrl(path).data.publicUrl)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {valor && <img src={valor} alt="" className="h-16 w-16 rounded-xl bg-white object-contain" />}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
      <button type="button" onClick={() => input.current?.click()} className="btn-sm border border-linha" disabled={enviando}>
        {enviando ? 'Enviando...' : valor ? 'Trocar imagem' : 'Enviar imagem'}
      </button>
      {valor && (
        <button type="button" onClick={() => onChange('')} className="text-sm text-perigo">Remover</button>
      )}
      {erro && <span className="erro">{erro}</span>}
    </div>
  )
}
