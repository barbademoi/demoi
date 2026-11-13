'use client'

import { useState } from 'react'
import type { DiaPassado } from '@/lib/tarefix/estadoHoje'
import { FUSO } from '@/lib/tarefix/datas'
import { foraDoHorario } from '@/lib/tarefix/prazo'
import { rotuloAutoavaliacao } from '@/lib/tarefix/continuas'
import { detalhePlacar } from '@/lib/tarefix/placarTexto'
import { Termometro } from '@/components/tarefix/Termometro'
import { Modal } from '@/components/tarefix/ui'

const horaSP = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

/** Um dia que já passou, só para consulta (não dá para marcar). */
export function DiaAnterior({ dia, fechamento }: { dia: DiaPassado; fechamento: string }) {
  const [foto, setFoto] = useState<string | null>(null)

  if (dia.folga) return <div className="tf-cartao mt-5 px-5 py-8 text-center text-tf-suave">Foi dia de folga.</div>
  if (dia.tarefas.length === 0) return <div className="tf-cartao mt-5 px-5 py-8 text-center text-tf-suave">Nenhuma tarefa neste dia.</div>

  const feitas = dia.tarefas.filter((t) => t.status === 'feita').length
  return (
    <div className="mt-5 space-y-4">
      <p className="text-2xl font-extrabold leading-tight tracking-tight">
        {feitas === dia.tarefas.length ? 'Dia 100%. Mandou bem!' : `Você fez ${feitas} de ${dia.tarefas.length} tarefas.`}
      </p>
      <section className="tf-cartao p-5">
        <Termometro rotulo="Resultado do dia" percentual={dia.dia?.percentual ?? null} detalhe={detalhePlacar(dia.dia, '')} grande />
      </section>

      <ul className="tf-cartao divide-y divide-tf-borda">
        {[...dia.tarefas.filter((t) => t.continua), ...dia.tarefas.filter((t) => !t.continua)].map((t) => {
          const feita = t.status === 'feita'
          const reprovada = t.status === 'reprovada'
          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  feita ? 'bg-tf-marca text-white' : reprovada ? 'bg-tf-texto text-tf-fundo' : 'border-2 border-tf-borda'
                }`}
                aria-label={feita ? 'feita' : reprovada ? 'reprovada' : 'não feita'}
              >
                {feita && (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
                {reprovada && <span className="text-sm font-extrabold">!</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-bold ${feita ? '' : 'text-tf-suave'}`}>{t.titulo}</p>
                <p className="text-sm text-tf-suave">
                  {t.continua && 'O dia todo · '}
                  {feita && t.feita_em
                    ? `feita às ${horaSP(t.feita_em)}${foraDoHorario(t, dia.data, fechamento) ? ' · fora do horário' : ''}`
                    : reprovada
                      ? `voltou: “${t.motivo_reprovacao ?? ''}”`
                      : 'não foi feita'}
                  {feita && rotuloAutoavaliacao(t.autoavaliacao) && ` · você: ${rotuloAutoavaliacao(t.autoavaliacao)}`}
                </p>
                {t.observacao && <p className="text-sm italic text-tf-texto">Obs.: {t.observacao}</p>}
              </div>
              {t.foto_url && (
                <button type="button" onClick={() => setFoto(t.foto_url)} className="shrink-0" aria-label="Ver foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.foto_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {dia.extras.length > 0 && (
        <section className="tf-cartao p-4">
          <p className="mb-2 font-bold">Extras</p>
          <ul className="space-y-2">
            {dia.extras.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1">{x.descricao}</span>
                <span className="shrink-0 rounded-full bg-tf-marca-clara px-3 py-1 text-xs font-bold text-tf-marca-texto">
                  {x.status === 'pendente' ? 'Aguardando' : x.status === 'aprovada' ? 'Aprovada' : 'Não aprovada'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-sm text-tf-suave">Dias anteriores são só para consulta.</p>

      <Modal aberto={foto !== null} aoFechar={() => setFoto(null)} titulo="Foto enviada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {foto && <img src={foto} alt="Foto da tarefa" className="w-full rounded-2xl" />}
      </Modal>
    </div>
  )
}
