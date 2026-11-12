'use client'

import { useEffect, useState } from 'react'
import type { CardColaborador, PainelHoje, TarefaPainel } from '@/lib/tarefix/painelHoje'
import { dataCurta, FUSO } from '@/lib/tarefix/datas'
import { Avatar, Erro, Modal, useAcao, useAviso } from '@/components/tarefix/ui'
import { Termometro } from '@/components/tarefix/Termometro'
import { decidirExtra, reprovarTarefa, restaurarTarefa } from './acoesHoje'
import { duracao, estaAtrasada, minutosDeAtraso } from '@/lib/tarefix/prazo'

const horaSP = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

function Status({ t }: { t: TarefaPainel }) {
  if (t.status === 'feita')
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-tf-marca text-white" aria-label="feita">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
    )
  if (t.status === 'reprovada')
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-tf-texto text-tf-fundo" aria-label="reprovada">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 010 12h-3" /></svg>
      </span>
    )
  return <span className="h-7 w-7 shrink-0 rounded-lg border-2 border-tf-borda" aria-label="pendente" />
}

export function PainelHojeCliente({ painel, destaque }: { painel: PainelHoje; destaque: string | null }) {
  const [aberta, setAberta] = useState<{ tarefa: TarefaPainel; colaborador: string } | null>(null)
  const [reprovando, setReprovando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const acao = useAcao()
  const acaoExtra = useAcao()
  const aviso = useAviso()

  useEffect(() => {
    if (destaque) document.getElementById(`c-${destaque}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [destaque])

  // mantém o modal em sincronia depois que a página revalida
  useEffect(() => {
    if (!aberta) return
    const nova = painel.cards.flatMap((c) => c.tarefas).find((t) => t.id === aberta.tarefa.id)
    if (nova && nova !== aberta.tarefa) setAberta({ ...aberta, tarefa: nova })
  }, [painel, aberta])

  function abrir(t: TarefaPainel, c: CardColaborador) {
    acao.setErro(null)
    setReprovando(false)
    setMotivo('')
    setAberta({ tarefa: t, colaborador: c.nome.split(' ')[0] })
  }

  const totalFeitas = painel.cards.reduce((n, c) => n + (c.placar?.feitas ?? 0), 0)
  const totalTarefas = painel.cards.reduce((n, c) => n + (c.placar?.total ?? 0), 0)

  return (
    <div className="space-y-5">
      {totalTarefas > 0 && (
        <section className="tf-cartao p-5">
          <Termometro rotulo="Equipe hoje" percentual={Math.round((totalFeitas / totalTarefas) * 100)} detalhe={`${totalFeitas} de ${totalTarefas} tarefas`} />
        </section>
      )}

      {/* ----------------------------- extras ----------------------------- */}
      {painel.extrasPendentes.length > 0 && (
        <section className="tf-cartao p-5">
          <h2 className="mb-3 text-lg font-extrabold">Extras para aprovar ({painel.extrasPendentes.length})</h2>
          <ul className="space-y-3">
            {painel.extrasPendentes.map((x) => (
              <li key={x.id} className="rounded-2xl border border-tf-borda p-4">
                <div className="flex gap-3">
                  {x.foto_url && (
                    <a href={x.foto_url} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.foto_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    </a>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-tf-suave">
                      {x.colaborador.split(' ')[0]} · {x.data === painel.hoje ? 'hoje' : dataCurta(x.data)}
                    </p>
                    <p className="mt-0.5">{x.descricao}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" className="tf-botao min-h-[44px]" disabled={acaoExtra.pendente} onClick={() => acaoExtra.rodar(() => decidirExtra(x.id, 'aprovada'), () => aviso.mostrar('Extra aprovada'))}>
                    Aprovar
                  </button>
                  <button type="button" className="tf-botao2 min-h-[44px]" disabled={acaoExtra.pendente} onClick={() => acaoExtra.rodar(() => decidirExtra(x.id, 'recusada'), () => aviso.mostrar('Extra recusada'))}>
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Erro texto={acaoExtra.erro} />
          </div>
        </section>
      )}

      {/* ----------------------- cards por colaborador ---------------------- */}
      {painel.cards.map((c) => {
        const fotos = c.tarefas.filter((t) => t.foto_url)
        const pendentes = c.tarefas.filter((t) => t.status === 'pendente').length
        const atrasadas = c.tarefas.filter((t) => estaAtrasada(t, painel.hoje)).length
        const previsto = c.tarefas.reduce((n, t) => n + (t.tempo_estimado_min ?? 0), 0)
        return (
          <section key={c.id} id={`c-${c.id}`} className={`tf-cartao scroll-mt-4 p-5 ${destaque === c.id ? 'border-tf-marca' : ''}`}>
            <div className="flex items-center gap-3">
              <Avatar nome={c.nome} url={c.foto_url} tamanho={48} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold">{c.nome}</h2>
                <p className="text-sm text-tf-suave">
                  {c.folga ? 'Folga hoje' : c.tarefas.length === 0 ? 'Sem tarefas hoje' : pendentes ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Tudo feito'}
                  {atrasadas > 0 && ` · ${atrasadas} atrasada${atrasadas > 1 ? 's' : ''}`}
                  {previsto > 0 && ` · ${duracao(previsto)} previstos`}
                  {c.funcao && ` · ${c.funcao}`}
                </p>
              </div>
            </div>

            {c.placar && (
              <div className="mt-4">
                <Termometro rotulo="Hoje" percentual={c.placar.percentual} detalhe={`${c.placar.feitas} de ${c.placar.total}`} />
              </div>
            )}

            {fotos.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {fotos.map((t) => (
                  <button key={t.id} type="button" onClick={() => abrir(t, c)} className="relative shrink-0" aria-label={`Foto: ${t.titulo}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.foto_url!} alt="" className={`h-20 w-20 rounded-xl object-cover ${t.status === 'reprovada' ? 'opacity-40' : ''}`} />
                    {t.status === 'reprovada' && <span className="absolute inset-x-1 bottom-1 rounded-md bg-tf-texto px-1 text-[10px] font-bold text-tf-fundo">reprovada</span>}
                  </button>
                ))}
              </div>
            )}

            {c.tarefas.length > 0 && (
              <ul className="mt-4 divide-y divide-tf-borda border-t border-tf-borda">
                {c.tarefas.map((t) => {
                  const clicavel = t.status !== 'pendente'
                  const conteudo = (
                    <>
                      <Status t={t} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-bold ${t.status === 'pendente' ? '' : 'text-tf-suave'}`}>{t.titulo}</span>
                        {t.status === 'reprovada' && t.motivo_reprovacao && <span className="block truncate text-sm text-tf-suave">Voltou: {t.motivo_reprovacao}</span>}
                        {estaAtrasada(t, painel.hoje) ? (
                          <span className="mt-0.5 inline-block rounded-full bg-tf-texto px-2 py-0.5 text-[11px] font-bold text-tf-fundo">atrasada · até {t.horario_limite}</span>
                        ) : t.status === 'feita' && minutosDeAtraso(t) > 0 ? (
                          <span className="block text-sm text-tf-suave">{minutosDeAtraso(t)} min depois do prazo ({t.horario_limite})</span>
                        ) : (
                          (t.horario_limite || t.tempo_estimado_min) &&
                          t.status === 'pendente' && (
                            <span className="block text-sm text-tf-suave">{[t.horario_limite && `até ${t.horario_limite}`, duracao(t.tempo_estimado_min)].filter(Boolean).join(' · ')}</span>
                          )
                        )}
                      </span>
                      <span className="shrink-0 text-sm text-tf-suave">
                        {t.exige_foto && !t.foto_url && t.status === 'pendente' ? 'foto' : t.feita_em && t.status !== 'pendente' ? horaSP(t.feita_em) : ''}
                      </span>
                    </>
                  )
                  return (
                    <li key={t.id}>
                      {clicavel ? (
                        <button type="button" onClick={() => abrir(t, c)} className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left">
                          {conteudo}
                        </button>
                      ) : (
                        <div className="flex min-h-[52px] items-center gap-3 py-2">{conteudo}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {/* -------------------------- detalhe / reprovar -------------------------- */}
      <Modal aberto={aberta !== null} aoFechar={() => setAberta(null)} titulo={aberta ? aberta.tarefa.titulo : ''}>
        {aberta && (
          <div className="space-y-4">
            {aberta.tarefa.foto_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={aberta.tarefa.foto_url} alt={`Foto: ${aberta.tarefa.titulo}`} className="max-h-[55dvh] w-full rounded-2xl bg-tf-fundo object-contain" />
            )}
            <p className="text-tf-suave">
              {aberta.colaborador}
              {aberta.tarefa.feita_em && ` · feita às ${horaSP(aberta.tarefa.feita_em)}`}
            </p>
            {aberta.tarefa.status === 'reprovada' && (
              <p className="rounded-xl bg-tf-texto px-4 py-3 text-sm font-bold text-tf-fundo">Reprovada: {aberta.tarefa.motivo_reprovacao}</p>
            )}

            {aberta.tarefa.status === 'feita' && !reprovando && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="tf-botao" onClick={() => setAberta(null)}>
                  Ok
                </button>
                <button type="button" className="tf-botao2" onClick={() => setReprovando(true)}>
                  Reprovar
                </button>
              </div>
            )}

            {aberta.tarefa.status === 'feita' && reprovando && (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  acao.rodar(() => reprovarTarefa(aberta.tarefa.id, motivo), () => {
                    setAberta(null)
                    aviso.mostrar('Tarefa reprovada')
                  })
                }}
              >
                <label className="tf-rotulo" htmlFor="motivo">
                  Motivo (o colaborador vai ver)
                </label>
                <input id="motivo" className="tf-campo" autoFocus maxLength={140} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Faltou limpar o espelho" />
                <p className="text-sm text-tf-suave">A tarefa deixa de contar no percentual. Hoje, ainda dá para refazer antes do fechamento.</p>
                <Erro texto={acao.erro} />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="tf-botao2" onClick={() => setReprovando(false)} disabled={acao.pendente}>
                    Voltar
                  </button>
                  <button type="submit" className="tf-botao" disabled={acao.pendente || !motivo.trim()}>
                    {acao.pendente ? 'Salvando…' : 'Reprovar'}
                  </button>
                </div>
              </form>
            )}

            {aberta.tarefa.status === 'reprovada' && (
              <>
                <Erro texto={acao.erro} />
                <button
                  type="button"
                  className="tf-botao2 w-full"
                  disabled={acao.pendente}
                  onClick={() => acao.rodar(() => restaurarTarefa(aberta.tarefa.id), () => {
                    setAberta(null)
                    aviso.mostrar('Reprovação desfeita')
                  })}
                >
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
