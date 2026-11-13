'use client'

import { useRef, useState } from 'react'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { comprimirImagem } from '@/lib/tarefix/imagem'
import { Avatar, Erro, Rotulo, useAcao, useAviso } from '@/components/tarefix/ui'
import { salvarDadosColaborador } from '../acoes'
import { DICAS } from '@/components/tarefix/dicas'

type Props = {
  empresaId: string
  colaborador: { id: string; nome: string; funcao_id: string | null; foto_url: string | null }
  funcoes: { id: string; nome: string; ativo: boolean }[]
}

export function DadosColaborador({ empresaId, colaborador, funcoes }: Props) {
  const [nome, setNome] = useState(colaborador.nome)
  const [funcaoId, setFuncaoId] = useState(colaborador.funcao_id ?? '')
  const [foto, setFoto] = useState(colaborador.foto_url)
  const [enviando, setEnviando] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)
  const { pendente, erro, setErro, rodar } = useAcao()
  const aviso = useAviso()

  async function trocarFoto(f: File) {
    setErro(null)
    setEnviando(true)
    try {
      const blob = await comprimirImagem(f, 512, 0.8)
      const caminho = `${empresaId}/colaboradores/${colaborador.id}-${Date.now()}.jpg`
      const supabase = createTarefixClient()
      const { error } = await supabase.storage.from('tarefix-midia').upload(caminho, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const url = supabase.storage.from('tarefix-midia').getPublicUrl(caminho).data.publicUrl
      setFoto(url)
      rodar(() => salvarDadosColaborador({ id: colaborador.id, nome: nome || colaborador.nome, funcao_id: funcaoId || null, foto_url: url }), () => aviso.mostrar('Foto atualizada'))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui enviar a foto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        rodar(() => salvarDadosColaborador({ id: colaborador.id, nome, funcao_id: funcaoId || null, foto_url: foto }), () => aviso.mostrar('Dados salvos'))
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar nome={nome || colaborador.nome} url={foto} tamanho={72} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tf-botao2 min-h-[44px] px-4 text-sm" disabled={enviando} onClick={() => arquivo.current?.click()}>
            {enviando ? 'Enviando…' : foto ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {foto && (
            <button
              type="button"
              className="min-h-[44px] px-3 text-sm font-bold text-tf-suave"
              onClick={() => {
                setFoto(null)
                rodar(() => salvarDadosColaborador({ id: colaborador.id, nome, funcao_id: funcaoId || null, foto_url: null }), () => aviso.mostrar('Foto removida'))
              }}
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={arquivo}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) trocarFoto(f)
          }}
        />
      </div>
      <div>
        <label className="tf-rotulo" htmlFor="d-nome">Nome</label>
        <input id="d-nome" className="tf-campo" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Rotulo htmlFor="d-funcao" {...DICAS.funcao}>Função</Rotulo>
        <select id="d-funcao" className="tf-campo" value={funcaoId} onChange={(e) => setFuncaoId(e.target.value)}>
          <option value="">Sem função</option>
          {funcoes
            .filter((f) => f.ativo || f.id === colaborador.funcao_id)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
        </select>
      </div>
      <Erro texto={erro} />
      <button type="submit" className="tf-botao w-full" disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar dados'}
      </button>
      {aviso.elemento}
    </form>
  )
}
