'use client'

import { useEffect, useRef, useState } from 'react'
import type { TarefaAvulsa, TarefaModelo } from '@/lib/tarefix/tipos'
import { dataCurta, dataPorExtenso } from '@/lib/tarefix/datas'
import { duracao, fimPrevisto, horarioHHMM, janela } from '@/lib/tarefix/prazo'
import { ChipsDias, Erro, Interruptor, Modal, resumoDias, useAcao, useAviso } from '@/components/tarefix/ui'
import { excluirAvulsa, excluirModelo, reordenarModelos, salvarAvulsa, salvarModelo, type DadosAvulsa, type DadosModelo } from './acoes'

type Props = {
  colaborador: { id: string; nome: string }
  modelos: TarefaModelo[]
  avulsas: TarefaAvulsa[]
  hoje: string
}

function IconeCamera() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="exige foto">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function EditorTarefas({ colaborador, modelos, avulsas, hoje }: Props) {
  const primeiroNome = colaborador.nome.split(' ')[0]
  const aviso = useAviso()

  /* ----------------------------- recorrentes ----------------------------- */
  const [itens, setItens] = useState(modelos)
  const arrastando = useRef(false)
  useEffect(() => {
    if (!arrastando.current) setItens(modelos)
  }, [modelos])

  const [modelo, setModelo] = useState<DadosModelo | null>(null)
  const acaoModelo = useAcao()
  const acaoOrdem = useAcao()

  function abrirModelo(m?: TarefaModelo) {
    acaoModelo.setErro(null)
    setModelo(
      m
        ? {
            id: m.id, colaborador_id: colaborador.id, titulo: m.titulo, descricao: m.descricao ?? '', dias_semana: m.dias_semana, exige_foto: m.exige_foto, ativo: m.ativo,
            continua: m.continua ?? false, peso: m.peso ?? 1,
            horario_inicio: horarioHHMM(m.horario_inicio) ?? '', horario_limite: horarioHHMM(m.horario_limite) ?? '', tempo_estimado_min: m.tempo_estimado_min ? String(m.tempo_estimado_min) : '',
          }
        : { colaborador_id: colaborador.id, titulo: '', descricao: '', dias_semana: [1, 2, 3, 4, 5, 6], exige_foto: false, ativo: true, continua: false, peso: 1, horario_inicio: '', horario_limite: '', tempo_estimado_min: '' }
    )
  }

  /* ------------------------ arrastar para ordenar ------------------------ */
  // Ouve a janela inteira durante o arraste e guarda o estado em refs: assim
  // não depende de "pointer capture" (que se perde quando a lista reordena o
  // DOM) nem de closures antigas entre um render e outro.
  const lista = useRef<HTMLUListElement>(null)
  const [idArrastado, setIdArrastado] = useState<string | null>(null)
  const [deslocamento, setDeslocamento] = useState(0)
  const itensRef = useRef(itens)
  itensRef.current = itens
  const arraste = useRef<{ id: string; inicioY: number; ordemInicial: string[] } | null>(null)
  const limparArraste = useRef<() => void>(() => {})
  useEffect(() => () => limparArraste.current(), [])

  function iniciarArraste(e: React.PointerEvent, id: string) {
    e.preventDefault()
    arrastando.current = true
    arraste.current = { id, inicioY: e.clientY, ordemInicial: itensRef.current.map((i) => i.id) }
    setIdArrastado(id)
    setDeslocamento(0)

    const mover = (ev: PointerEvent) => {
      const a = arraste.current
      if (!a || !lista.current) return
      ev.preventDefault()
      const atuais = itensRef.current
      const elementos = Array.from(lista.current.children) as HTMLElement[]
      const idx = atuais.findIndex((i) => i.id === a.id)
      if (idx < 0 || !elementos[idx]) return
      const dy = ev.clientY - a.inicioY
      const metade = elementos[idx].offsetHeight / 2
      // passou da metade da linha → troca de lugar com o vizinho
      if (dy > metade && idx < atuais.length - 1) {
        const novo = [...atuais]
        ;[novo[idx], novo[idx + 1]] = [novo[idx + 1], novo[idx]]
        a.inicioY += elementos[idx + 1].offsetHeight
        itensRef.current = novo
        setItens(novo)
      } else if (dy < -metade && idx > 0) {
        const novo = [...atuais]
        ;[novo[idx], novo[idx - 1]] = [novo[idx - 1], novo[idx]]
        a.inicioY -= elementos[idx - 1].offsetHeight
        itensRef.current = novo
        setItens(novo)
      }
      setDeslocamento(ev.clientY - a.inicioY)
    }

    const terminar = () => {
      limparArraste.current()
      const a = arraste.current
      arraste.current = null
      arrastando.current = false
      setIdArrastado(null)
      setDeslocamento(0)
      if (!a) return
      const ids = itensRef.current.map((i) => i.id)
      if (ids.join() !== a.ordemInicial.join()) {
        acaoOrdem.rodar(() => reordenarModelos(colaborador.id, ids), () => aviso.mostrar('Ordem salva'))
      }
    }

    window.addEventListener('pointermove', mover, { passive: false })
    window.addEventListener('pointerup', terminar)
    window.addEventListener('pointercancel', terminar)
    limparArraste.current = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', terminar)
      window.removeEventListener('pointercancel', terminar)
    }
  }

  /* ------------------------------- avulsas ------------------------------- */
  const [avulsa, setAvulsa] = useState<DadosAvulsa | null>(null)
  const acaoAvulsa = useAcao()
  const futuras = avulsas.filter((a) => a.data >= hoje)
  const passadas = avulsas.filter((a) => a.data < hoje).reverse()

  function abrirAvulsa(a?: TarefaAvulsa) {
    acaoAvulsa.setErro(null)
    setAvulsa(
      a
        ? {
            id: a.id, colaborador_id: colaborador.id, titulo: a.titulo, descricao: a.descricao ?? '', data: a.data, exige_foto: a.exige_foto,
            continua: a.continua ?? false, peso: a.peso ?? 1,
            horario_inicio: horarioHHMM(a.horario_inicio) ?? '', horario_limite: horarioHHMM(a.horario_limite) ?? '', tempo_estimado_min: a.tempo_estimado_min ? String(a.tempo_estimado_min) : '',
          }
        : { colaborador_id: colaborador.id, titulo: '', descricao: '', data: hoje, exige_foto: false, continua: false, peso: 1, horario_inicio: '', horario_limite: '', tempo_estimado_min: '' }
    )
  }

  return (
    <div className="space-y-8">
      {/* ============================ RECORRENTES ============================ */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Recorrentes</h2>
            <p className="text-sm text-tf-suave">Repetem nos dias da semana escolhidos.</p>
          </div>
          <button type="button" className="tf-botao min-h-[44px] shrink-0 whitespace-nowrap px-4 text-sm" onClick={() => abrirModelo()}>
            + Nova
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="tf-cartao px-5 py-8 text-center text-tf-suave">Nenhuma tarefa recorrente para {primeiroNome}.</div>
        ) : (
          <ul ref={lista} className="tf-cartao divide-y divide-tf-borda overflow-hidden">
            {itens.map((m) => {
              const esse = m.id === idArrastado
              return (
                <li
                  key={m.id}
                  className={`relative flex items-stretch bg-tf-card ${esse ? 'z-10 shadow-lg ring-2 ring-tf-marca' : ''} ${m.ativo ? '' : 'opacity-50'}`}
                  style={esse ? { transform: `translateY(${deslocamento}px)` } : undefined}
                >
                  <button
                    type="button"
                    aria-label={`Arrastar ${m.titulo}`}
                    className="flex w-12 shrink-0 cursor-grab touch-none items-center justify-center text-tf-suave active:cursor-grabbing"
                    onPointerDown={(e) => iniciarArraste(e, m.id)}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                      <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                      <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => abrirModelo(m)} className="flex min-h-[64px] flex-1 flex-col justify-center py-3 pr-5 text-left">
                    <span className="flex items-center gap-2 font-bold">
                      {m.titulo}
                      {m.exige_foto && <span className="text-tf-marca-texto"><IconeCamera /></span>}
                    </span>
                    <span className="text-sm text-tf-suave">
                      {[resumoDias(m.dias_semana), m.continua ? 'o dia todo' : janela(m), !m.continua && duracao(m.tempo_estimado_min), m.peso > 1 && `vale ${m.peso}×`].filter(Boolean).join(' · ')}
                      {!m.ativo && ' · pausada'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="mt-2">
          <Erro texto={acaoOrdem.erro} />
        </div>
      </section>

      {/* ============================== AVULSAS ============================== */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Avulsas</h2>
            <p className="text-sm text-tf-suave">Só em uma data específica.</p>
          </div>
          <button type="button" className="tf-botao min-h-[44px] shrink-0 whitespace-nowrap px-4 text-sm" onClick={() => abrirAvulsa()}>
            + Avulsa
          </button>
        </div>
        {futuras.length === 0 && passadas.length === 0 ? (
          <div className="tf-cartao px-5 py-8 text-center text-tf-suave">Nenhuma tarefa avulsa.</div>
        ) : (
          <ul className="tf-cartao divide-y divide-tf-borda">
            {[...futuras, ...passadas].map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => abrirAvulsa(a)} className={`flex min-h-[64px] w-full items-center gap-4 px-5 py-3 text-left ${a.data < hoje ? 'opacity-50' : ''}`}>
                  <span className="w-14 shrink-0 rounded-lg bg-tf-marca-clara py-1 text-center text-sm font-extrabold text-tf-marca-texto">
                    {a.data === hoje ? 'Hoje' : dataCurta(a.data)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-bold">
                      {a.titulo}
                      {a.exige_foto && <span className="text-tf-marca-texto"><IconeCamera /></span>}
                    </span>
                    {(a.continua || janela(a) || a.tempo_estimado_min || a.peso > 1) && (
                      <span className="block text-sm text-tf-suave">
                        {[a.continua ? 'o dia todo' : janela(a), !a.continua && duracao(a.tempo_estimado_min), a.peso > 1 && `vale ${a.peso}×`].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ========================= MODAL RECORRENTE ========================= */}
      <Modal aberto={modelo !== null} aoFechar={() => setModelo(null)} titulo={modelo?.id ? 'Editar tarefa' : `Nova tarefa de ${primeiroNome}`}>
        {modelo && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              acaoModelo.rodar(() => salvarModelo(modelo), () => {
                setModelo(null)
                aviso.mostrar('Tarefa salva')
              })
            }}
          >
            <div>
              <label className="tf-rotulo" htmlFor="m-titulo">Título</label>
              <input id="m-titulo" className="tf-campo" autoFocus value={modelo.titulo} onChange={(e) => setModelo({ ...modelo, titulo: e.target.value })} placeholder="Ex.: Limpar as bancadas" />
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="m-desc">Descrição (opcional)</label>
              <textarea id="m-desc" className="tf-campo min-h-[88px] py-3" value={modelo.descricao} onChange={(e) => setModelo({ ...modelo, descricao: e.target.value })} placeholder="Como fazer, onde, detalhes…" />
            </div>
            <div>
              <span className="tf-rotulo">Dias da semana</span>
              <ChipsDias valor={modelo.dias_semana} aoMudar={(v) => setModelo({ ...modelo, dias_semana: v })} />
            </div>
            <Interruptor
              rotulo="Vale o dia todo"
              descricao="Atendimento, comandas, verificar algo… Fica fixa no topo; o colaborador confirma perto do fechamento e diz como foi."
              ligado={modelo.continua}
              aoMudar={(x) => setModelo({ ...modelo, continua: x, peso: x && modelo.peso === 1 ? 2 : modelo.peso })}
            />
            <div>
              <span className="tf-rotulo">Peso no percentual</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Peso">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={modelo.peso === n}
                    onClick={() => setModelo({ ...modelo, peso: n })}
                    className={`min-h-[48px] rounded-xl border font-extrabold transition ${modelo.peso === n ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              <p className="mt-1 text-sm text-tf-suave">Vale como {modelo.peso} {modelo.peso > 1 ? 'tarefas comuns' : 'tarefa comum'} no percentual do dia.</p>
            </div>
            {!modelo.continua && (
              <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tf-rotulo" htmlFor="modelo-inicio">Começar às</label>
                <input id="modelo-inicio" type="time" className="tf-campo" value={modelo.horario_inicio} onChange={(e) => setModelo({ ...modelo, horario_inicio: e.target.value })} />
              </div>
              <div>
                <label className="tf-rotulo" htmlFor="modelo-tempo">Tempo estimado</label>
                <div className="relative">
                  <input
                    id="modelo-tempo"
                    className="tf-campo !pr-14"
                    inputMode="numeric"
                    placeholder="—"
                    value={modelo.tempo_estimado_min}
                    onChange={(e) => setModelo({ ...modelo, tempo_estimado_min: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-tf-suave">min</span>
                </div>
              </div>
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="modelo-prazo">Fazer até (opcional)</label>
              <input id="modelo-prazo" type="time" className="tf-campo max-w-[180px]" value={modelo.horario_limite} onChange={(e) => setModelo({ ...modelo, horario_limite: e.target.value })} />
              <p className="mt-1 text-sm text-tf-suave">
                {(() => {
                  const fim = fimPrevisto({ horario_inicio: modelo.horario_inicio || null, horario_limite: null, tempo_estimado_min: Number(modelo.tempo_estimado_min) || null })
                  if (modelo.horario_limite) return `Depois das ${modelo.horario_limite} sem fazer, aparece como atrasada.`
                  if (fim) return `Fim previsto ${fim}. Sem "fazer até", passou disso aparece como atrasada.`
                  return 'Atraso só aparece com horário. Não muda o %.'
                })()}
              </p>
            </div>
              </>
            )}
            <Interruptor rotulo="Exige foto" descricao="Só conclui com uma foto tirada na hora." ligado={modelo.exige_foto} aoMudar={(v) => setModelo({ ...modelo, exige_foto: v })} />
            {modelo.id && <Interruptor rotulo="Ativa" descricao="Pausar tira a tarefa dos próximos dias." ligado={modelo.ativo} aoMudar={(v) => setModelo({ ...modelo, ativo: v })} />}
            {modelo.id && <p className="text-sm text-tf-suave">Mudanças valem a partir de agora; dias que já passaram não mudam.</p>}
            <Erro texto={acaoModelo.erro} />
            <button type="submit" className="tf-botao w-full" disabled={acaoModelo.pendente}>
              {acaoModelo.pendente ? 'Salvando…' : 'Salvar'}
            </button>
            {modelo.id && (
              <button
                type="button"
                className="tf-botao2 w-full"
                disabled={acaoModelo.pendente}
                onClick={() => {
                  if (!confirm('Excluir esta tarefa? O histórico dos dias passados continua salvo.')) return
                  acaoModelo.rodar(() => excluirModelo(modelo.id!), () => {
                    setModelo(null)
                    aviso.mostrar('Tarefa excluída')
                  })
                }}
              >
                Excluir tarefa
              </button>
            )}
          </form>
        )}
      </Modal>

      {/* =========================== MODAL AVULSA =========================== */}
      <Modal aberto={avulsa !== null} aoFechar={() => setAvulsa(null)} titulo={avulsa?.id ? 'Editar avulsa' : `Tarefa avulsa de ${primeiroNome}`}>
        {avulsa && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              acaoAvulsa.rodar(() => salvarAvulsa(avulsa), () => {
                setAvulsa(null)
                aviso.mostrar('Avulsa salva')
              })
            }}
          >
            <div>
              <label className="tf-rotulo" htmlFor="a-titulo">Título</label>
              <input id="a-titulo" className="tf-campo" autoFocus value={avulsa.titulo} onChange={(e) => setAvulsa({ ...avulsa, titulo: e.target.value })} />
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="a-desc">Descrição (opcional)</label>
              <textarea id="a-desc" className="tf-campo min-h-[88px] py-3" value={avulsa.descricao} onChange={(e) => setAvulsa({ ...avulsa, descricao: e.target.value })} />
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="a-data">Data</label>
              <input id="a-data" type="date" className="tf-campo" min={avulsa.id ? undefined : hoje} value={avulsa.data} onChange={(e) => setAvulsa({ ...avulsa, data: e.target.value })} />
              {avulsa.data && <p className="mt-1 text-sm text-tf-suave first-letter:uppercase">{dataPorExtenso(avulsa.data)}</p>}
            </div>
            <Interruptor
              rotulo="Vale o dia todo"
              descricao="Atendimento, comandas, verificar algo… Fica fixa no topo; o colaborador confirma perto do fechamento e diz como foi."
              ligado={avulsa.continua}
              aoMudar={(x) => setAvulsa({ ...avulsa, continua: x, peso: x && avulsa.peso === 1 ? 2 : avulsa.peso })}
            />
            <div>
              <span className="tf-rotulo">Peso no percentual</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Peso">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={avulsa.peso === n}
                    onClick={() => setAvulsa({ ...avulsa, peso: n })}
                    className={`min-h-[48px] rounded-xl border font-extrabold transition ${avulsa.peso === n ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              <p className="mt-1 text-sm text-tf-suave">Vale como {avulsa.peso} {avulsa.peso > 1 ? 'tarefas comuns' : 'tarefa comum'} no percentual do dia.</p>
            </div>
            {!avulsa.continua && (
              <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tf-rotulo" htmlFor="avulsa-inicio">Começar às</label>
                <input id="avulsa-inicio" type="time" className="tf-campo" value={avulsa.horario_inicio} onChange={(e) => setAvulsa({ ...avulsa, horario_inicio: e.target.value })} />
              </div>
              <div>
                <label className="tf-rotulo" htmlFor="avulsa-tempo">Tempo estimado</label>
                <div className="relative">
                  <input
                    id="avulsa-tempo"
                    className="tf-campo !pr-14"
                    inputMode="numeric"
                    placeholder="—"
                    value={avulsa.tempo_estimado_min}
                    onChange={(e) => setAvulsa({ ...avulsa, tempo_estimado_min: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-tf-suave">min</span>
                </div>
              </div>
            </div>
            <div>
              <label className="tf-rotulo" htmlFor="avulsa-prazo">Fazer até (opcional)</label>
              <input id="avulsa-prazo" type="time" className="tf-campo max-w-[180px]" value={avulsa.horario_limite} onChange={(e) => setAvulsa({ ...avulsa, horario_limite: e.target.value })} />
              <p className="mt-1 text-sm text-tf-suave">
                {(() => {
                  const fim = fimPrevisto({ horario_inicio: avulsa.horario_inicio || null, horario_limite: null, tempo_estimado_min: Number(avulsa.tempo_estimado_min) || null })
                  if (avulsa.horario_limite) return `Depois das ${avulsa.horario_limite} sem fazer, aparece como atrasada.`
                  if (fim) return `Fim previsto ${fim}. Sem "fazer até", passou disso aparece como atrasada.`
                  return 'Atraso só aparece com horário. Não muda o %.'
                })()}
              </p>
            </div>
              </>
            )}
            <Interruptor rotulo="Exige foto" ligado={avulsa.exige_foto} aoMudar={(v) => setAvulsa({ ...avulsa, exige_foto: v })} />
            <Erro texto={acaoAvulsa.erro} />
            <button type="submit" className="tf-botao w-full" disabled={acaoAvulsa.pendente}>
              {acaoAvulsa.pendente ? 'Salvando…' : 'Salvar'}
            </button>
            {avulsa.id && (
              <button
                type="button"
                className="tf-botao2 w-full"
                disabled={acaoAvulsa.pendente}
                onClick={() => {
                  if (!confirm('Excluir esta tarefa avulsa?')) return
                  acaoAvulsa.rodar(() => excluirAvulsa(avulsa.id!), () => {
                    setAvulsa(null)
                    aviso.mostrar('Avulsa excluída')
                  })
                }}
              >
                Excluir
              </button>
            )}
          </form>
        )}
      </Modal>
      {aviso.elemento}
    </div>
  )
}
