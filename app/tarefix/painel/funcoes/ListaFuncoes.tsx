'use client'

import { useState } from 'react'
import type { Funcao } from '@/lib/tarefix/tipos'
import { Erro, Interruptor, Modal, Titulo, Vazio, useAcao, useAviso } from '@/components/tarefix/ui'
import { excluirFuncao, salvarFuncao } from './acoes'

type Edicao = { id?: string; nome: string; descricao: string; ativo: boolean }
const NOVA: Edicao = { nome: '', descricao: '', ativo: true }

export function ListaFuncoes({ funcoes, contagem }: { funcoes: Funcao[]; contagem: Record<string, number> }) {
  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const { pendente, erro, setErro, rodar } = useAcao()
  const aviso = useAviso()

  function abrir(f?: Funcao) {
    setErro(null)
    setEdicao(f ? { id: f.id, nome: f.nome, descricao: f.descricao ?? '', ativo: f.ativo } : NOVA)
  }

  const botaoNova = (
    <button type="button" className="tf-botao" onClick={() => abrir()}>
      + Nova função
    </button>
  )

  return (
    <>
      <Titulo acao={funcoes.length > 0 ? botaoNova : undefined}>Funções</Titulo>

      {funcoes.length === 0 ? (
        <Vazio titulo="Nenhuma função ainda" texto="Funções agrupam a equipe: Atendimento, Limpeza, Caixa…" acao={botaoNova} />
      ) : (
        <ul className="tf-cartao divide-y divide-tf-borda">
          {funcoes.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => abrir(f)} className={`flex min-h-[64px] w-full items-center gap-4 px-5 py-3 text-left hover:bg-tf-marca-clara/50 ${f.ativo ? '' : 'opacity-50'}`}>
                <span className="flex-1">
                  <span className="block font-bold">
                    {f.nome}
                    {!f.ativo && <span className="ml-2 text-sm font-medium text-tf-suave">(inativa)</span>}
                  </span>
                  {f.descricao && <span className="block text-sm text-tf-suave">{f.descricao}</span>}
                </span>
                <span className="text-sm text-tf-suave">
                  {contagem[f.id] ?? 0} {(contagem[f.id] ?? 0) === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={edicao !== null} aoFechar={() => setEdicao(null)} titulo={edicao?.id ? 'Editar função' : 'Nova função'}>
        {edicao && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              rodar(() => salvarFuncao(edicao), () => {
                setEdicao(null)
                aviso.mostrar('Função salva')
              })
            }}
          >
            <div>
              <label className="tf-rotulo" htmlFor="f-nome">Nome</label>
              <input id="f-nome" className="tf-campo" autoFocus value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} placeholder="Ex.: Atendimento" />
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="f-desc">Descrição (opcional)</label>
              <textarea id="f-desc" className="tf-campo min-h-[96px] py-3" value={edicao.descricao} onChange={(e) => setEdicao({ ...edicao, descricao: e.target.value })} />
            </div>
            {edicao.id && <Interruptor rotulo="Ativa" ligado={edicao.ativo} aoMudar={(v) => setEdicao({ ...edicao, ativo: v })} />}
            <Erro texto={erro} />
            <button type="submit" className="tf-botao w-full" disabled={pendente}>
              {pendente ? 'Salvando…' : 'Salvar'}
            </button>
            {edicao.id && (
              <button
                type="button"
                className="tf-botao2 w-full"
                disabled={pendente}
                onClick={() => {
                  if (!confirm('Excluir esta função? Quem estiver nela fica sem função.')) return
                  rodar(() => excluirFuncao(edicao.id!), () => {
                    setEdicao(null)
                    aviso.mostrar('Função excluída')
                  })
                }}
              >
                Excluir função
              </button>
            )}
          </form>
        )}
      </Modal>
      {aviso.elemento}
    </>
  )
}
