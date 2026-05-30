'use client'

import { useRef, useState, useTransition } from 'react'
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { salvarLogoUrl, removerLogo } from './logoActions'

interface Props {
  estabelecimentoId: string
  nomeEmpresa: string
  logoInicial: string | null
}

const LIMITE_BYTES = 1024 * 1024 // 1 MB
const TIPOS_OK = ['image/jpeg', 'image/png', 'image/webp']

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '—'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export default function LogoSection({ estabelecimentoId, nomeEmpresa, logoInicial }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(logoInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro(null)

    if (!TIPOS_OK.includes(arquivo.type)) {
      setErro('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (arquivo.size > LIMITE_BYTES) {
      setErro('Imagem muito grande. Máximo 1MB.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const ext = arquivo.type === 'image/png' ? 'png' : arquivo.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${estabelecimentoId}/logo.${ext}`

      // upsert pra substituir caso já exista.
      const { error: upErr } = await supabase.storage
        .from('empresas-logos')
        .upload(path, arquivo, { upsert: true, contentType: arquivo.type })
      if (upErr) {
        setErro('Falha no upload. Tente de novo.')
        return
      }

      const { data } = supabase.storage.from('empresas-logos').getPublicUrl(path)
      // Cache-buster pra forçar atualização da imagem.
      const url = `${data.publicUrl}?v=${Date.now()}`

      const res = await salvarLogoUrl(url)
      if (res?.error) {
        setErro(res.error)
        return
      }
      setLogoUrl(url)
    })
  }

  function remover() {
    setErro(null)
    startTransition(async () => {
      const res = await removerLogo()
      if (res?.error) {
        setErro(res.error)
        return
      }
      setLogoUrl(null)
    })
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-text inline-flex items-center gap-2">
          <ImageIcon size={20} strokeWidth={1.5} color="#8B6F47" /> Identidade Visual
        </h2>
        <p className="text-sm text-chumbo mt-1">
          A logo aparece pra você, sua equipe e seus clientes. Use uma imagem quadrada de pelo menos 200×200px.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`Logo de ${nomeEmpresa}`}
            className="w-20 h-20 rounded-full object-cover bg-linho border border-border"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center bg-linho text-marrom font-semibold text-2xl border border-border"
            aria-hidden
          >
            {iniciais(nomeEmpresa)}
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selecionarArquivo}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="btn-secondary text-sm"
          >
            <Upload size={16} strokeWidth={1.5} />
            {isPending ? 'Enviando…' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={remover}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs text-vinho self-start"
            >
              <Trash2 size={13} strokeWidth={1.5} /> Remover
            </button>
          )}
        </div>
      </div>

      {erro && <p className="text-sm text-vinho">{erro}</p>}
    </div>
  )
}
