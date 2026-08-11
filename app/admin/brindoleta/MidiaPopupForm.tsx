'use client'

import { useState, useTransition } from 'react'
import { salvarMidiaPopup } from './actions'

/**
 * Onde eu troco o GIF/vídeo que o popup de oferta mostra.
 *
 * Aceita URL em vez de upload direto porque o arquivo pode vir de qualquer
 * lugar (Storage do Supabase, Drive público, CDN) e porque trocar a URL não
 * exige deploy. Vazio devolve o placeholder.
 */
export default function MidiaPopupForm({
  urlInicial, tipoInicial,
}: { urlInicial: string; tipoInicial: 'gif' | 'video' | '' }) {
  const [url, setUrl] = useState(urlInicial)
  const [tipo, setTipo] = useState<'gif' | 'video' | ''>(tipoInicial)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [pendente, start] = useTransition()

  function salvar() {
    setErro(''); setMsg('')
    start(async () => {
      const r = await salvarMidiaPopup(url, tipo)
      if (r.error) setErro(r.error)
      else setMsg('Mídia atualizada. O popup já mostra ela.')
    })
  }

  return (
    <section className="card mb-6 p-5">
      <p className="text-sm font-semibold text-text">Demonstração do popup de oferta</p>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">
        GIF ou vídeo curto da Brindoleta funcionando, exibido no popup que oferece o módulo
        a quem ainda não tem. Enquanto estiver vazio, aparece um placeholder — o popup
        continua funcionando normalmente.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setMsg('') }}
          placeholder="https://… (link do GIF ou vídeo)"
          className="input min-w-0 flex-1 text-[16px]"
          style={{ fontSize: '16px' }}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value as 'gif' | 'video' | '')}
          className="input max-w-[10rem] text-sm">
          <option value="">Tipo…</option>
          <option value="gif">GIF / imagem</option>
          <option value="video">Vídeo (mp4)</option>
        </select>
        <button type="button" onClick={salvar} disabled={pendente}
          className="btn-primary text-sm disabled:opacity-50">
          {pendente ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {erro && <p className="mt-2 text-xs text-red-300">{erro}</p>}
      {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}

      {url && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <div className="aspect-[16/10] w-full bg-surface-2">
            {tipo === 'video'
              ? <video src={url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={url} alt="Prévia da demonstração" className="h-full w-full object-cover" />}
          </div>
        </div>
      )}
    </section>
  )
}
