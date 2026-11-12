'use client'

import { useState } from 'react'
import type { TarefaPainel } from '@/lib/tarefix/painelHoje'
import { FUSO } from '@/lib/tarefix/datas'
import { Erro, Modal, useAcao, useAviso } from '@/components/tarefix/ui'
import { reprovarTarefa, restaurarTarefa } from '../acoesHoje'
import { duracao, estaAtrasada, janela, minutosDeAtraso } from '@/lib/tarefix/prazo'
import { rotuloAutoavaliacao } from '@/lib/tarefix/continuas'

const horaSP = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
const STATUS = { feita: 'Feita', pendente: 'Não feita', reprovada: 'Reprovada' } as const
const STATUS_EXTRA = { pendente: 'Aguardando', aprovada: 'Aprovada', recusada: 'Recusada' } as const

type Extra = { id: string; descricao: string; status: keyof typeof STATUS_EXTRA; foto_url: string | null }

export function DiaHistorico({ tarefas, extras, mesFechado, data }: { tarefas: TarefaPainel[]; extras: Extra[]; mesFechado: boolean; data: string }) {
  const [aberta, setAberta] = useState<TarefaPainel | null>(null)
  const [motivo, setMotivo] = useState('')
  const acao = useAcao()
  const aviso = useAviso()
  const atual = aberta ? tarefas.find((t) => t.id === aberta.id) ?? aberta : null

  return (
    <div className="space-y-5">
      <ul className="tf-cartao divide-y divide-tf-borda">
        {[...tarefas.filter((t) => t.continua), ...tarefas.filter((t) => !t.continua)].map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                acao.setErro(null)
                setMotivo('')
                setAberta(t)
              }}
              className="flex min-h-[64px] w-full items-center gap-3 px-5 py-3 text-left hover:bg-tf-marca-clara/50"
            >
              {t.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.foto_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className={`h-12 w-12 shrink-0 rounded-lg ${t.status === 'feita' ? 'bg-tf-marca' : t.status === 'reprovada' ? 'bg-tf-texto' : 'border-2 border-tf-borda'}`} aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{t.titulo}</span>
                <span className="block truncate text-sm text-tf-suave">
                  {t.continua && 'O dia todo · '}
                  {STATUS[t.status]}
                  {t.peso > 1 && ` · vale ${t.peso}×`}
                  {rotuloAutoavaliacao(t.autoavaliacao) && ` · se avaliou: ${rotuloAutoavaliacao(t.autoavaliacao)}`}
                  {t.feita_em && t.status !== 'pendente' && ` · ${horaSP(t.feita_em)}`}
                  {t.status === 'reprovada' && t.motivo_reprovacao && ` · ${t.motivo_reprovacao}`}
                  {janela(t) && ` · ${janela(t)}`}
                  {minutosDeAtraso(t) > 0 && ` (${minutosDeAtraso(t)} min depois)`}
                  {estaAtrasada(t, data) && ' (não feita no prazo)'}
                  {duracao(t.tempo_estimado_min) && ` · ${duracao(t.tempo_estimado_min)}`}
                </span>
                {t.observacao && <span className="block text-sm italic text-tf-texto">Obs.: {t.observacao}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {extras.length > 0 && (
        <section className="tf-cartao p-5">
          <h3 className="mb-3 font-extrabold">Extras</h3>
          <ul className="space-y-2">
            {extras.map((x) => (
              <li key={x.id} className="flex items-center gap-3">
                {x.foto_url && (
                  <a href={x.foto_url} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.foto_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  </a>
                )}
                <span className="min-w-0 flex-1 text-sm">{x.descricao}</span>
                <span className="shrink-0 rounded-full bg-tf-marca-clara px-3 py-1 text-xs font-bold text-tf-marca-texto">{STATUS_EXTRA[x.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal aberto={atual !== null} aoFechar={() => setAberta(null)} titulo={atual?.titulo ?? ''}>
        {atual && (
          <div className="space-y-4">
            {atual.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={atual.foto_url} alt={`Foto: ${atual.titulo}`} className="max-h-[55dvh] w-full rounded-2xl bg-tf-fundo object-contain" />
            )}
            {atual.descricao && <p className="text-tf-suave">{atual.descricao}</p>}
            <p className="font-bold">
              {STATUS[atual.status]}
              {atual.feita_em && atual.status !== 'pendente' && ` às ${horaSP(atual.feita_em)}`}
            </p>
            {atual.observacao && (
              <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm">
                <b>Observação do colaborador:</b> {atual.observacao}
              </p>
            )}
            {atual.status === 'reprovada' && <p className="rounded-xl bg-tf-texto px-4 py-3 text-sm font-bold text-tf-fundo">Motivo: {atual.motivo_reprovacao}</p>}
            {mesFechado && atual.status !== 'pendente' && <p className="text-sm text-tf-suave">Mês fechado: não dá mais para alterar.</p>}

            {!mesFechado && atual.status === 'feita' && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  acao.rodar(() => reprovarTarefa(atual.id, motivo), () => {
                    setAberta(null)
                    aviso.mostrar('Tarefa reprovada')
                  })
                }}
              >
                <label className="tf-rotulo" htmlFor="m-hist">Reprovar (motivo, o colaborador vai ver)</label>
                <input id="m-hist" className="tf-campo" maxLength={140} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                <Erro texto={acao.erro} />
                <button type="submit" className="tf-botao2 w-full" disabled={acao.pendente || !motivo.trim()}>
                  {acao.pendente ? 'Salvando…' : 'Reprovar'}
                </button>
              </form>
            )}
            {!mesFechado && atual.status === 'reprovada' && (
              <>
                <Erro texto={acao.erro} />
                <button type="button" className="tf-botao2 w-full" disabled={acao.pendente} onClick={() => acao.rodar(() => restaurarTarefa(atual.id), () => { setAberta(null); aviso.mostrar('Reprovação desfeita') })}>
                  Desfazer reprovação
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
      {aviso.elemento}
    </div>
  )
}
