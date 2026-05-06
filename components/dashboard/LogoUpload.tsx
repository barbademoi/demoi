'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { atualizarLogo } from '@/app/dashboard/actions'
import { uploadFoto } from '@/lib/uploadFoto'

interface Props {
  logoUrl: string | null
  nomeAbrev: string
}

export default function LogoUpload({ logoUrl, nomeAbrev }: Props) {
  const [src, setSrc] = useState(logoUrl)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        const url = await uploadFoto(file, 'logos')
        const fd = new FormData()
        fd.set('logo_url', url)
        await atualizarLogo(fd)
        setSrc(url)
      } catch {
        // silently fail, logo is optional
      }
    })
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      title="Clique para trocar o logo"
      className="w-10 h-10 rounded-full bg-surface-2 border border-border hover:border-primary transition-colors flex items-center justify-center overflow-hidden shrink-0"
    >
      {isPending ? (
        <span className="text-text-muted text-xs animate-pulse">…</span>
      ) : src ? (
        <Image src={src} alt="Logo" width={40} height={40} className="w-full h-full object-cover" unoptimized />
      ) : (
        <span className="text-text-muted font-serif text-sm">{nomeAbrev}</span>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  )
}
