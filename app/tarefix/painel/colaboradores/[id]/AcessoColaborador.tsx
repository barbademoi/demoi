'use client'

import { useEffect, useState } from 'react'
import { Erro, Modal, useAcao, useAviso } from '@/components/tarefix/ui'
import { gerarNovoLink, trocarPin } from '../acoes'

export function AcessoColaborador({ id, nome, token, ativo }: { id: string; nome: string; token: string; ativo: boolean }) {
  const [origem, setOrigem] = useState('')
  const [pinAberto, setPinAberto] = useState(false)
  const [pin, setPin] = useState('')
  const { pendente, erro, setErro, rodar } = useAcao()
  const aviso = useAviso()

  useEffect(() => setOrigem(window.location.origin), [])
  const link = `${origem}/tarefix/c/${token}`
  const primeiroNome = nome.split(' ')[0]
  const textoWhats = `Oi, ${primeiroNome}! Este é o seu link do Tarefix, onde ficam as suas tarefas do dia:\n${link}\n\nO PIN eu te passo pessoalmente. Dica: abra o link e adicione à tela inicial do celular.`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      aviso.mostrar('Link copiado')
    } catch {
      prompt('Copie o link:', link)
    }
  }

  return (
    <div className="space-y-3">
      <div className="break-all rounded-xl border border-tf-borda bg-tf-fundo px-4 py-3 font-mono text-xs text-tf-suave">
        {origem ? link : '…'}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[15px] leading-tight">
        <button type="button" className="tf-botao" onClick={copiar} disabled={!ativo}>
          Copiar link
        </button>
        <a
          className={`tf-botao2 ${ativo ? '' : 'pointer-events-none opacity-50'}`}
          href={`https://wa.me/?text=${encodeURIComponent(textoWhats)}`}
          target="_blank"
          rel="noreferrer"
        >
          Enviar no WhatsApp
        </a>
        <button
          type="button"
          className="tf-botao2"
          onClick={() => {
            setPin('')
            setErro(null)
            setPinAberto(true)
          }}
        >
          Trocar PIN
        </button>
        <button
          type="button"
          className="tf-botao2"
          disabled={pendente}
          onClick={() => {
            if (!confirm(`Gerar um link novo para ${primeiroNome}? O link antigo para de funcionar na hora.`)) return
            rodar(() => gerarNovoLink(id), () => aviso.mostrar('Link novo gerado'))
          }}
        >
          Gerar novo link
        </button>
      </div>
      {!pinAberto && <Erro texto={erro} />}

      <Modal aberto={pinAberto} aoFechar={() => setPinAberto(false)} titulo={`Novo PIN de ${primeiroNome}`}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            rodar(() => trocarPin(id, pin), () => {
              setPinAberto(false)
              aviso.mostrar('PIN trocado')
            })
          }}
        >
          <input
            className="tf-campo text-center text-3xl tracking-[0.5em]"
            inputMode="numeric"
            autoFocus
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            aria-label="Novo PIN"
          />
          <p className="text-sm text-tf-suave">Quem já estava conectado vai precisar digitar o PIN novo.</p>
          <Erro texto={erro} />
          <button type="submit" className="tf-botao w-full" disabled={pendente || pin.length !== 4}>
            {pendente ? 'Salvando…' : 'Salvar PIN'}
          </button>
        </form>
      </Modal>
      {aviso.elemento}
    </div>
  )
}
