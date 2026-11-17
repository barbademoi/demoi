'use client'

import { useState } from 'react'
import type { ConfigPessoal } from '@/lib/tarefix/tipos'
import { Erro, Interruptor, Rotulo, useAcao, useAviso } from '@/components/tarefix/ui'
import { salvarPessoal } from './acoes'

/** Lembretes do Meu dia (chegam no celular onde você ativou as notificações). */
export function FormPessoal({ inicial }: { inicial: ConfigPessoal }) {
  const [c, setC] = useState(inicial)
  const { pendente, erro, rodar } = useAcao()
  const aviso = useAviso()
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        rodar(() => salvarPessoal(c), () => aviso.mostrar('Lembretes salvos'))
      }}
    >
      <div>
        <Rotulo dica={<p>Um aviso antes da hora marcada para você se preparar. Escolha &quot;Só na hora&quot; se não quiser o aviso antecipado.</p>} exemplo={<>Tarefa às 10:00 com 15 min → aviso às 09:45.</>}>
          Lembrete antes da tarefa
        </Rotulo>
        <div className="flex flex-wrap gap-2">
          {[0, 5, 10, 15, 30, 60].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={c.antes_min === m}
              onClick={() => setC({ ...c, antes_min: m })}
              className={`min-h-[40px] rounded-full border px-4 text-sm font-bold ${c.antes_min === m ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
            >
              {m === 0 ? 'Só na hora' : `${m} min`}
            </button>
          ))}
        </div>
      </div>
      <Interruptor rotulo="Avisar na hora" descricao="Na hora marcada de cada tarefa." ligado={c.na_hora} aoMudar={(v) => setC({ ...c, na_hora: v })} />
      <Interruptor
        rotulo="Lembrete insistente"
        descricao="Não marcou? Avisa de novo 30 e 60 min depois."
        ligado={c.insistente}
        aoMudar={(v) => setC({ ...c, insistente: v })}
        dica={<p>Para quem esquece fácil no meio do atendimento. Depois de 2 lembretes extras ele para.</p>}
        exemplo={<>“Pagar o boleto” às 10:00 → avisos às 10:00, 10:30 e 11:00.</>}
      />
      {(
        [
          ['manha', 'Resumo da manhã', 'Quantas tarefas tem hoje e qual é a primeira.', '07:00'],
          ['noite', 'Resumo da noite', 'O que você fez e o que ficou para amanhã.', '21:00'],
        ] as const
      ).map(([campo, rotulo, desc, padrao]) => (
        <div key={campo} className="space-y-2">
          <Interruptor rotulo={rotulo} descricao={desc} ligado={c[campo] !== null} aoMudar={(v) => setC({ ...c, [campo]: v ? padrao : null })} />
          {c[campo] !== null && (
            <input type="time" className="tf-campo max-w-[160px]" value={c[campo] ?? ''} onChange={(e) => setC({ ...c, [campo]: e.target.value || padrao })} aria-label={`Horário do ${rotulo.toLowerCase()}`} />
          )}
        </div>
      ))}
      <Interruptor
        rotulo="Passar para amanhã o que não fiz"
        descricao="Tarefa avulsa não feita vai sozinha para o dia seguinte."
        ligado={c.passar_para_amanha}
        aoMudar={(v) => setC({ ...c, passar_para_amanha: v })}
        dica={<p>As que se repetem não passam (senão acumulam): amanhã elas já aparecem de novo.</p>}
        exemplo={<>“Ligar pro contador” não deu hoje → amanhã ela aparece com a marca “veio de 17/11”.</>}
      />
      <Erro texto={erro} />
      <button type="submit" className="tf-botao w-full" disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar lembretes'}
      </button>
      {aviso.elemento}
    </form>
  )
}
