'use client'

import { useState } from 'react'
import { Link2, Copy, Check, MessageCircle, CheckCircle2 } from 'lucide-react'
import { mensagemConvite } from '@/lib/whatsapp'

interface Props {
  nome: string
  url: string
  destaque?: boolean
}

export default function LinkProfissional({ nome, url, destaque = false }: Props) {
  const [copiado, setCopiado] = useState(false)

  const textoWhats = mensagemConvite(nome, url)
  const whatsHref = `https://wa.me/?text=${encodeURIComponent(textoWhats)}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback simples se clipboard não estiver disponível.
      const el = document.getElementById('link-prof-input') as HTMLInputElement | null
      el?.select()
      document.execCommand?.('copy')
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div
      className={[
        'card p-5',
        destaque ? 'ring-2 ring-primary bg-primary-soft/40' : '',
      ].join(' ')}
    >
      {destaque && (
        <p className="inline-flex items-center gap-1.5 text-verde-musgo text-sm font-medium mb-3">
          <CheckCircle2 size={16} strokeWidth={1.5} /> Profissional criado! Compartilhe o link abaixo.
        </p>
      )}
      <h3 className="font-semibold text-text mb-1 inline-flex items-center gap-2">
        <Link2 size={18} strokeWidth={1.5} color="#8B6F47" /> Link do profissional
      </h3>
      <p className="text-chumbo text-sm mb-3">
        Compartilhe este link com <strong className="text-text">{nome}</strong> pelo WhatsApp. Ele
        acompanha os elogios dele pelo celular, sem precisar criar conta.
      </p>

      <input
        id="link-prof-input"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="input text-sm mb-3 bg-white"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={copiar} className="btn-secondary flex-1 text-sm">
          {copiado ? <Check size={18} strokeWidth={1.5} /> : <Copy size={18} strokeWidth={1.5} />}
          {copiado ? 'Link copiado!' : 'Copiar link'}
        </button>
        <a
          href={whatsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-sm"
        >
          <MessageCircle size={18} strokeWidth={1.5} />
          Compartilhar no WhatsApp
        </a>
      </div>
    </div>
  )
}
