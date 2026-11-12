'use client'

import { Erro, Interruptor, useAcao } from '@/components/tarefix/ui'
import { definirAtivo } from '../acoes'

export function StatusColaborador({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const { pendente, erro, rodar } = useAcao()
  const primeiroNome = nome.split(' ')[0]
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
    </div>
  )
}
