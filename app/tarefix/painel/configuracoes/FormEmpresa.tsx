'use client'

import { useRef, useState } from 'react'
import type { Empresa } from '@/lib/tarefix/tipos'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { comprimirImagem } from '@/lib/tarefix/imagem'
import { Erro, useAcao, useAviso } from '@/components/tarefix/ui'
import { salvarEmpresa } from './acoes'

export function FormEmpresa({ empresa }: { empresa: Empresa }) {
  const [nome, setNome] = useState(empresa.nome)
  const [logo, setLogo] = useState(empresa.logo_url)
  const [horario, setHorario] = useState(empresa.horario_fechamento.slice(0, 5))
  const [tom, setTom] = useState(empresa.tom_mensagens)
  const [enviando, setEnviando] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)
  const { pendente, erro, setErro, rodar } = useAcao()
  const aviso = useAviso()

  async function enviarLogo(f: File) {
    setErro(null)
    setEnviando(true)
    try {
      const blob = await comprimirImagem(f, 512, 0.85)
      const caminho = `${empresa.id}/logo-${Date.now()}.jpg`
      const supabase = createTarefixClient()
      const { error } = await supabase.storage.from('tarefix-midia').upload(caminho, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      setLogo(supabase.storage.from('tarefix-midia').getPublicUrl(caminho).data.publicUrl)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui enviar o logo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        rodar(() => salvarEmpresa({ nome, logo_url: logo, horario_fechamento: horario, tom_mensagens: tom }), () => aviso.mostrar('Ajustes salvos'))
      }}
    >
      <div>
        <label className="tf-rotulo" htmlFor="e-nome">Nome da empresa</label>
        <input id="e-nome" className="tf-campo" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div>
        <span className="tf-rotulo">Logo</span>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-tf-borda bg-tf-fundo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-tf-suave">sem logo</span>}
          </span>
          <button type="button" className="tf-botao2 min-h-[44px] px-4 text-sm" disabled={enviando} onClick={() => arquivo.current?.click()}>
            {enviando ? 'Enviando…' : logo ? 'Trocar' : 'Enviar logo'}
          </button>
          {logo && (
            <button type="button" className="min-h-[44px] px-2 text-sm font-bold text-tf-suave" onClick={() => setLogo(null)}>
              Remover
            </button>
          )}
          <input
            ref={arquivo}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) enviarLogo(f)
            }}
          />
        </div>
      </div>

      <div>
        <label className="tf-rotulo" htmlFor="e-horario">Horário de fechamento do dia</label>
        <input id="e-horario" type="time" className="tf-campo max-w-[180px]" value={horario} onChange={(e) => setHorario(e.target.value)} />
        <p className="mt-1 text-sm text-tf-suave">Depois desse horário o dia trava e o que ficou pendente conta como não feito. (Horário de Brasília)</p>
      </div>

      <div>
        <span className="tf-rotulo">Tom das mensagens</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['zoeira', 'Zoeira', '“Dia 100%. Pode sair andando em câmera lenta.”'],
              ['neutro', 'Neutro', '“Dia 100%. Ótimo trabalho!”'],
            ] as const
          ).map(([valor, rotulo, exemplo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={tom === valor}
              onClick={() => setTom(valor)}
              className={`rounded-2xl border p-4 text-left transition ${tom === valor ? 'border-tf-marca bg-tf-marca-clara' : 'border-tf-borda'}`}
            >
              <span className="block font-extrabold">{rotulo}</span>
              <span className="mt-1 block text-sm text-tf-suave">{exemplo}</span>
            </button>
          ))}
        </div>
      </div>

      <Erro texto={erro} />
      <button type="submit" className="tf-botao w-full" disabled={pendente || enviando}>
        {pendente ? 'Salvando…' : 'Salvar ajustes'}
      </button>
      {aviso.elemento}
    </form>
  )
}
