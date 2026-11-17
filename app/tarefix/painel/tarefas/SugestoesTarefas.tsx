'use client'

import { useMemo, useState } from 'react'
import type { Sugestao, Sugestoes } from '@/lib/tarefix/sugestoes'
import { duracao, janela } from '@/lib/tarefix/prazo'
import { Erro, Modal, resumoDias, useAcao } from '@/components/tarefix/ui'
import { adicionarSugestoes } from './acoes'

const norm = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

function resumo(s: Sugestao) {
  return [resumoDias(s.dias_semana), s.continua ? 'o dia todo' : janela(s), !s.continua && duracao(s.tempo_estimado_min), s.peso > 1 && `vale ${s.peso}×`, s.exige_foto && 'com foto']
    .filter(Boolean)
    .join(' · ')
}

type Props = {
  sugestoes: Sugestoes
  colaborador: { id: string; nome: string }
  titulosAtuais: string[]
  /** true quando quem vê é a própria barbearia de referência */
  referencia: boolean
  aoAdicionar: (n: number) => void
}

/** Botão + modal "Sugestões prontas": copia tarefas da barbearia de referência. */
export function useSugestoes({ sugestoes, colaborador, titulosAtuais, referencia, aoAdicionar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [abertaDesc, setAbertaDesc] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const acao = useAcao()
  const primeiroNome = colaborador.nome.split(' ')[0]

  const jaTem = useMemo(() => new Set(titulosAtuais.map(norm)), [titulosAtuais])
  const disponiveis = sugestoes.grupos.flatMap((g) => g.itens).filter((s) => !jaTem.has(norm(s.titulo))).length
  const grupos = useMemo(() => {
    const q = norm(busca)
    if (!q) return sugestoes.grupos
    return sugestoes.grupos
      .map((g) => ({ ...g, itens: g.itens.filter((s) => norm(`${s.titulo} ${s.descricao ?? ''} ${g.nome}`).includes(q)) }))
      .filter((g) => g.itens.length > 0)
  }, [busca, sugestoes.grupos])

  function alternar(id: string) {
    setMarcadas((m) => {
      const n = new Set(m)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function alternarGrupo(itens: Sugestao[]) {
    const livres = itens.filter((s) => !jaTem.has(norm(s.titulo)))
    const todas = livres.every((s) => marcadas.has(s.id))
    setMarcadas((m) => {
      const n = new Set(m)
      livres.forEach((s) => (todas ? n.delete(s.id) : n.add(s.id)))
      return n
    })
  }

  function abrir() {
    setMarcadas(new Set())
    setBusca('')
    setAbertaDesc(null)
    acao.setErro(null)
    setAberto(true)
  }

  // ordem de inserção = ordem em que aparecem na lista
  const ordemTela = sugestoes.grupos.flatMap((g) => g.itens.map((s) => s.id))
  const qtd = marcadas.size

  const modal = (
    <Modal aberto={aberto} aoFechar={() => !acao.pendente && setAberto(false)} titulo="Sugestões prontas">
      <div className="space-y-4">
        <p className="text-tf-suave">
          {sugestoes.grupos[0]?.itens[0]?.id.startsWith('rotina-') ? (
            <>Rotina pronta para dono de barbearia: agenda, caixa, equipe, conteúdo e saúde. Marque o que serve para você e ajuste os horários.</>
          ) : referencia ? (
            <>Estas são as tarefas da sua barbearia. É exatamente isso que os seus mentorados veem aqui, sempre atualizado.</>
          ) : (
            <>
              Tarefas que <b className="text-tf-texto">{sugestoes.origem}</b> usa no dia a dia. Marque as que servem para {primeiroNome}, adicione e depois ajuste horários e dias do seu jeito.
            </>
          )}
        </p>
        {sugestoes.total > 8 && (
          <input className="tf-campo" placeholder="Buscar: limpeza, caixa, stories…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar sugestão" />
        )}

        {grupos.length === 0 && <p className="py-6 text-center text-tf-suave">Nada encontrado para “{busca}”.</p>}

        {grupos.map((g) => {
          const livres = g.itens.filter((s) => !jaTem.has(norm(s.titulo)))
          const todas = livres.length > 0 && livres.every((s) => marcadas.has(s.id))
          return (
            <section key={g.nome}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-tf-suave">
                  {g.nome} <span className="font-bold normal-case">({g.itens.length})</span>
                </h3>
                {livres.length > 1 && (
                  <button type="button" className="min-h-[36px] text-sm font-bold text-tf-marca-texto" onClick={() => alternarGrupo(g.itens)}>
                    {todas ? 'Desmarcar' : 'Marcar todas'}
                  </button>
                )}
              </div>
              <ul className="divide-y divide-tf-borda rounded-2xl border border-tf-borda">
                {g.itens.map((s) => {
                  const tem = jaTem.has(norm(s.titulo))
                  const sel = marcadas.has(s.id)
                  return (
                    <li key={s.id} className={tem ? 'opacity-50' : ''}>
                      <div className="flex items-start gap-3 px-3 py-3">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={sel}
                          aria-label={s.titulo}
                          disabled={tem}
                          onClick={() => alternar(s.id)}
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-black transition ${
                            sel ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-transparent'
                          }`}
                        >
                          ✓
                        </button>
                        <div className="min-w-0 flex-1">
                          <button type="button" disabled={tem} onClick={() => alternar(s.id)} className="block text-left font-bold leading-snug">
                            {s.titulo}
                            {s.continua && <span className="ml-2 rounded-full bg-tf-marca px-2 py-0.5 align-middle text-[11px] font-extrabold text-white">dia todo</span>}
                            {tem && <span className="ml-2 rounded-full bg-tf-borda px-2 py-0.5 align-middle text-[11px] font-extrabold">{primeiroNome} já tem</span>}
                          </button>
                          <p className="text-sm text-tf-suave">{resumo(s)}</p>
                          {s.descricao && (
                            <>
                              <button
                                type="button"
                                className="mt-1 text-sm font-bold text-tf-marca-texto"
                                onClick={() => setAbertaDesc(abertaDesc === s.id ? null : s.id)}
                                aria-expanded={abertaDesc === s.id}
                              >
                                {abertaDesc === s.id ? 'Esconder como fazer' : 'Ver como fazer'}
                              </button>
                              {abertaDesc === s.id && <p className="mt-1 whitespace-pre-line rounded-xl bg-tf-fundo px-3 py-2 text-sm">{s.descricao}</p>}
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        <div className="sticky -bottom-8 -mx-5 border-t border-tf-borda bg-tf-card px-5 pb-2 pt-3 sm:-bottom-5">
          <Erro texto={acao.erro} />
          <button
            type="button"
            className="tf-botao w-full"
            disabled={qtd === 0 || acao.pendente}
            onClick={() =>
              acao.rodar(
                async () => {
                  const ids = ordemTela.filter((id) => marcadas.has(id))
                  const r = await adicionarSugestoes(colaborador.id, ids)
                  if (r.ok) {
                    setAberto(false)
                    aoAdicionar(r.adicionadas)
                  }
                  return r
                },
                undefined
              )
            }
          >
            {acao.pendente ? 'Adicionando…' : qtd === 0 ? 'Marque as tarefas que quer usar' : `Adicionar ${qtd} tarefa${qtd > 1 ? 's' : ''} para ${primeiroNome}`}
          </button>
        </div>
      </div>
    </Modal>
  )

  return { abrir, modal, disponiveis, total: sugestoes.total }
}
