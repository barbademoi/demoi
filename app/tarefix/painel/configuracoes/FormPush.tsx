'use client'

import { useState } from 'react'
import { AtivarNotificacoes } from '@/components/tarefix/AtivarNotificacoes'
import { Erro, Interruptor, useAcao, useAviso } from '@/components/tarefix/ui'
import type { TipoPush } from '@/lib/tarefix/push'
import { ativarPushDono, chavePushDono, desativarPushDono, salvarTiposPush, testarPushDono } from '../acoesPush'

type Props = {
  tipos: Record<TipoPush, boolean>
  lista: { tipo: TipoPush; rotulo: string; para: 'colaborador' | 'dono' }[]
}

export function FormPush({ tipos: inicial, lista }: Props) {
  const [tipos, setTipos] = useState(inicial)
  const salvar = useAcao()
  const teste = useAcao()
  const aviso = useAviso()

  function mudar(t: TipoPush, v: boolean) {
    const novo = { ...tipos, [t]: v }
    setTipos(novo)
    salvar.rodar(() => salvarTiposPush(novo), () => aviso.mostrar('Notificações salvas'))
  }

  return (
    <div className="space-y-5">
      <AtivarNotificacoes
        obterChave={chavePushDono}
        ativar={ativarPushDono}
        desativar={desativarPushDono}
        texto="Receba no seu celular o resumo do fechamento e as extras para aprovar, mesmo com o app fechado."
      />

      {(['colaborador', 'dono'] as const).map((para) => (
        <div key={para}>
          <p className="tf-rotulo">{para === 'colaborador' ? 'Para a equipe' : 'Para você'}</p>
          <div className="divide-y divide-tf-borda">
            {lista
              .filter((l) => l.para === para)
              .map((l) => (
                <Interruptor key={l.tipo} rotulo={l.rotulo} ligado={tipos[l.tipo]} desabilitado={salvar.pendente} aoMudar={(v) => mudar(l.tipo, v)} />
              ))}
          </div>
        </div>
      ))}
      <p className="text-sm text-tf-suave">
        Cada colaborador ativa no próprio celular, pelo link dele. No iPhone é preciso adicionar o Tarefix à tela inicial primeiro.
      </p>
      <Erro texto={salvar.erro} />

      <button
        type="button"
        className="tf-botao2 w-full"
        disabled={teste.pendente}
        onClick={() => teste.rodar(() => testarPushDono(), () => aviso.mostrar('Notificação de teste enviada'))}
      >
        {teste.pendente ? 'Enviando…' : 'Enviar notificação de teste para mim'}
      </button>
      <Erro texto={teste.erro} />
      {aviso.elemento}
    </div>
  )
}
