'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PLANOS } from '@/lib/planos'
import type { Membro } from '@/lib/membro'
import { salvarMembro } from '../actions'

export default function FormMembro({ membro }: { membro: Membro }) {
  const router = useRouter()
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [pendente, iniciar] = useTransition()
  return (
    <section className="card p-5">
      <h2 className="mb-1 text-xl font-bold">Dados do membro</h2>
      <p className="mb-4 text-sm text-suave">Ajuste manual. Para pagamento, use “Confirmar” acima: ele calcula as datas sozinho.</p>
      <form
        className="grid gap-3 sm:grid-cols-2"
        action={(fd) =>
          iniciar(async () => {
            const r = await salvarMembro(fd)
            setMsg({ ok: r.ok, t: r.ok ? r.msg ?? 'Salvo' : r.erro ?? 'Erro' })
            if (r.ok) router.refresh()
          })
        }
      >
        <input type="hidden" name="id" value={membro.id} />
        <label>
          <span className="rotulo text-sm">Status</span>
          <select name="status" defaultValue={membro.status} className="campo py-2.5">
            <option value="pendente">Aguardando pagamento</option>
            <option value="aguardando">Aguardando confirmação</option>
            <option value="ativo">Ativo</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>
        <label>
          <span className="rotulo text-sm">Plano</span>
          <select name="plano" defaultValue={membro.plano} className="campo py-2.5">
            {PLANOS.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo text-sm">Data de início</span>
          <input type="date" name="data_inicio" defaultValue={membro.data_inicio ?? ''} className="campo py-2.5" />
        </label>
        <label>
          <span className="rotulo text-sm">Vencimento</span>
          <input type="date" name="vencimento" defaultValue={membro.vencimento ?? ''} className="campo py-2.5" />
        </label>
        <label>
          <span className="rotulo text-sm">Perfil</span>
          <select name="perfil" defaultValue={membro.perfil ?? ''} className="campo py-2.5">
            <option value="">Ainda não definido</option>
            <option value="sozinho">Sozinho na cadeira</option>
            <option value="equipe">Com equipe</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-3">
            <input type="checkbox" name="fundador" defaultChecked={membro.fundador} className="h-5 w-5 accent-[#D9A441]" />
            Fundador (turma de 18/01/2027)
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="convidado" defaultChecked={membro.convidado} className="h-5 w-5 accent-[#D9A441]" />
            Mentorado convidado
          </label>
        </div>
        <label className="sm:col-span-2">
          <span className="rotulo text-sm">Observação interna</span>
          <textarea name="observacao" defaultValue={membro.observacao ?? ''} rows={2} className="campo py-2.5" />
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn-sm bg-latao px-5 text-fundo" disabled={pendente}>{pendente ? 'Salvando...' : 'Salvar'}</button>
          {msg && <span className={msg.ok ? 'text-ok' : 'text-perigo'}>{msg.t}</span>}
        </div>
      </form>
    </section>
  )
}
