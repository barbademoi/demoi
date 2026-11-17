'use client'

import { useEffect, useState } from 'react'
import { Modal, useAviso } from '@/components/tarefix/ui'

/** Assinar as tarefas na agenda do celular (alerta nativo 15 min antes). */
export function AgendaCelular({ caminho }: { caminho: string }) {
  const [aberto, setAberto] = useState(false)
  const [host, setHost] = useState('')
  const aviso = useAviso()
  useEffect(() => setHost(window.location.host), [])
  const https = `https://${host}${caminho}`
  const webcal = `webcal://${host}${caminho}`
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="tf-cartao flex w-full items-center gap-3 p-4 text-left hover:bg-tf-marca-clara/40">
        <span className="text-2xl" aria-hidden>
          📅
        </span>
        <span className="flex-1">
          <span className="block font-bold">Pôr na agenda do celular</span>
          <span className="block text-sm text-tf-suave">Alerta do próprio celular 15 min antes de cada tarefa, mesmo sem internet.</span>
        </span>
        <span className="text-xl text-tf-suave" aria-hidden>
          ›
        </span>
      </button>
      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo="Agenda do celular">
        <div className="space-y-4">
          <p className="text-tf-suave">
            As tarefas com horário dos próximos 14 dias aparecem na agenda, com <b className="text-tf-texto">alerta 15 min antes</b>. Faça isso uma vez só: a agenda se atualiza sozinha.
          </p>
          <div className="space-y-2">
            <p className="font-extrabold">iPhone</p>
            <a href={webcal} className="tf-botao w-full">
              Assinar no Calendário do iPhone
            </a>
            <p className="text-sm text-tf-suave">Toque em “Assinar” na tela que abrir. Confira em Ajustes → Calendário se os alertas estão ligados.</p>
          </div>
          <div className="space-y-2">
            <p className="font-extrabold">Android (Google Agenda)</p>
            <a href={google} target="_blank" rel="noreferrer" className="tf-botao2 w-full">
              Adicionar no Google Agenda
            </a>
            <p className="text-sm text-tf-suave">
              Abre o Google Agenda no navegador: confirme “Adicionar”. Depois, no app Google Agenda, ative a agenda “Tarefix” e as notificações dela (Configurações → Tarefix).
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-extrabold">Outra agenda</p>
            <button
              type="button"
              className="tf-botao2 w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(https)
                  aviso.mostrar('Link copiado')
                } catch {
                  prompt('Copie o link:', https)
                }
              }}
            >
              Copiar link da agenda
            </button>
            <p className="text-sm text-tf-suave">Cole em “Adicionar calendário por URL” (Outlook, Samsung Calendar e outros).</p>
          </div>
          <p className="rounded-xl bg-tf-fundo px-4 py-3 text-sm text-tf-suave">
            A agenda busca novidades de tempos em tempos (no Google pode levar algumas horas). Mudou algo agora? A notificação do Tarefix avisa na hora. Para marcar como feita, use o Tarefix ou o botão “Feito” da notificação.
          </p>
        </div>
      </Modal>
      {aviso.elemento}
    </>
  )
}
