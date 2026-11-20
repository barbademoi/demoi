'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Erro, Interruptor, Modal, useAcao } from '@/components/tarefix/ui'
import { definirAtivo, excluirColaborador } from '../acoes'

export function StatusColaborador({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const router = useRouter()
  const { pendente, erro, rodar } = useAcao()
  const exclusao = useAcao()
  const [aberto, setAberto] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const primeiroNome = nome.split(' ')[0]
  const confere = confirmacao.trim().toLowerCase() === primeiroNome.toLowerCase()

  return (
    <div className="space-y-3">
      <Interruptor
        rotulo="Colaborador ativo"
        descricao={ativo ? 'Desativar faz o link parar de funcionar. O histórico fica salvo.' : 'Reativar volta a liberar o mesmo link.'}
        ligado={ativo}
        desabilitado={pendente}
        aoMudar={(v) => {
          if (!v && !confirm(`Desativar ${primeiroNome}? O link para de funcionar; o histórico fica salvo.`)) return
          rodar(() => definirAtivo(id, v))
        }}
      />
      <Erro texto={erro} />

      <button
        type="button"
        className="min-h-[44px] text-sm font-bold text-tf-suave underline"
        onClick={() => {
          setConfirmacao('')
          setAberto(true)
        }}
      >
        Excluir colaborador
      </button>

      <Modal aberto={aberto} aoFechar={() => !exclusao.pendente && setAberto(false)} titulo={`Excluir ${primeiroNome}?`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!confere) return
            exclusao.rodar(() => excluirColaborador(id), () => {
              setAberto(false)
              router.replace('/tarefix/painel/colaboradores')
              router.refresh()
            })
          }}
        >
          <p className="rounded-2xl bg-tf-texto px-4 py-3 text-sm font-bold text-tf-fundo">
            Isso apaga de vez: tarefas, folgas, extras, fotos, histórico e fechamentos de mês de {primeiroNome}. Não dá para desfazer.
          </p>
          <p className="text-sm text-tf-suave">
            Só quer que ele pare de usar e manter o histórico? Feche esta janela e desligue <b>Colaborador ativo</b>.
          </p>
          <div>
            <label className="tf-rotulo" htmlFor="exc-nome">
              Para confirmar, digite <b className="text-tf-texto">{primeiroNome}</b>
            </label>
            <input id="exc-nome" className="tf-campo" autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          </div>
          <Erro texto={exclusao.erro} />
          <button type="submit" className="tf-botao w-full !bg-tf-texto !text-tf-fundo" disabled={!confere || exclusao.pendente}>
            {exclusao.pendente ? 'Excluindo…' : `Excluir ${primeiroNome} de vez`}
          </button>
        </form>
      </Modal>
    </div>
  )
}
