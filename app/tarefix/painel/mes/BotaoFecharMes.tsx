'use client'

import { useState } from 'react'
import { Erro, Modal, useAcao, useAviso } from '@/components/tarefix/ui'
import { fecharMes } from './acoes'

export function BotaoFecharMes({ anoMes, rotuloMes }: { anoMes: string; rotuloMes: string }) {
  const [aberto, setAberto] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const { pendente, erro, setErro, rodar } = useAcao()
  const aviso = useAviso()
  const palavra = 'FECHAR'

  return (
    <>
      <button
        type="button"
        className="tf-botao w-full"
        onClick={() => {
          setErro(null)
          setConfirmacao('')
          setAberto(true)
        }}
      >
        Fechar {rotuloMes}
      </button>
      <Modal aberto={aberto} aoFechar={() => !pendente && setAberto(false)} titulo={`Fechar ${rotuloMes}?`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            rodar(() => fecharMes(anoMes), () => {
              setAberto(false)
              aviso.mostrar('Mês fechado')
            })
          }}
        >
          <p>Os números deste mês viram definitivos: ninguém mais consegue marcar, reprovar, aprovar extras ou mudar folgas de {rotuloMes}.</p>
          <div>
            <label className="tf-rotulo" htmlFor="conf">Digite {palavra} para confirmar</label>
            <input id="conf" className="tf-campo" autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value.toUpperCase())} />
          </div>
          <Erro texto={erro} />
          <button type="submit" className="tf-botao w-full" disabled={pendente || confirmacao !== palavra}>
            {pendente ? 'Fechando…' : 'Fechar mês'}
          </button>
        </form>
      </Modal>
      {aviso.elemento}
    </>
  )
}
