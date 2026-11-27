'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registrarComprovante } from './actions'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']

export default function EnvioComprovante({
  userId,
  plano,
  destino = '/aguardando',
  rotulo = 'Já paguei',
}: {
  userId: string
  plano?: string
  destino?: string
  rotulo?: string
}) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [aberto, setAberto] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!arquivo) return setErro('Escolhe a foto ou o PDF do comprovante.')
    if (arquivo.size > 10 * 1024 * 1024) return setErro('Arquivo muito grande (máximo 10 MB).')
    const ext = (arquivo.name.split('.').pop() || '').toLowerCase()
    if (!TIPOS.includes(arquivo.type) && !['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'].includes(ext)) {
      return setErro('Manda uma imagem (foto ou print) ou um PDF.')
    }
    setErro('')
    setEnviando(true)
    try {
      const extOk = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'].includes(ext) ? ext : arquivo.type === 'application/pdf' ? 'pdf' : 'jpg'
      const path = `${userId}/${Date.now()}.${extOk}`
      const supabase = createClient()
      // Alguns Android mandam o arquivo sem tipo: deduz pela extensão.
      const tipo = arquivo.type || (extOk === 'pdf' ? 'application/pdf' : extOk === 'png' ? 'image/png' : extOk === 'webp' ? 'image/webp' : extOk.startsWith('hei') ? 'image/heic' : 'image/jpeg')
      const { error } = await supabase.storage.from('comprovantes').upload(path, arquivo, { contentType: tipo })
      if (error) throw error
      const r = await registrarComprovante(path, plano)
      if (!r.ok) throw new Error(r.erro)
      router.push(destino)
      router.refresh()
    } catch (e) {
      setErro((e as Error).message || 'Não deu pra enviar. Tenta de novo.')
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="btn-primario w-full sm:w-full">
        {rotulo}
      </button>
    )
  }

  return (
    <div className="card space-y-4 p-5">
      <p className="text-lg font-bold">Mande o comprovante</p>
      <p className="text-suave">Pode ser print da tela, foto ou PDF.</p>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
      />
      <button type="button" onClick={() => input.current?.click()} className="btn-secundario w-full sm:w-full">
        {arquivo ? `📎 ${arquivo.name}` : 'Escolher arquivo'}
      </button>
      {erro && <p className="erro">{erro}</p>}
      <button type="button" onClick={enviar} disabled={enviando || !arquivo} className="btn-primario w-full sm:w-full">
        {enviando ? 'Enviando...' : 'Enviar comprovante'}
      </button>
    </div>
  )
}
