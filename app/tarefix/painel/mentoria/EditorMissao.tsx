'use client'

import { useState } from 'react'
import { ChipsDias, Erro, Interruptor, Modal, Rotulo, useAcao } from '@/components/tarefix/ui'
import type { Missao } from '@/lib/tarefix/mentoria'
import { salvarMissao, type DadosMissao } from './acoes'
import { EditorChecklist } from '../tarefas/CamposExtras'

const NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

type Props = {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: () => void
  mentorados: { id: string; nome: string }[]
  /** Missão sendo editada (com quem já recebe). */
  missao?: (Missao & { para: string[] }) | null
  /** Ao criar dentro de um mentorado, ele já vem marcado. */
  paraPadrao?: string[]
  hoje: string
}

function inicial(p: Props): DadosMissao {
  const m = p.missao
  if (m)
    return {
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao ?? '',
      tipo: m.tipo,
      data: m.data ?? p.hoje,
      dias_semana: m.dias_semana,
      dia_prazo: m.dia_prazo,
      hora: m.hora ? m.hora.slice(0, 5) : '',
      prova: m.prova,
      aprovacao: m.aprovacao,
      mentorados: m.para,
      inicio: m.inicio ?? '',
      fim: m.fim ?? '',
      checklist: m.checklist ?? [],
    }
  return { titulo: '', descricao: '', tipo: 'data', data: p.hoje, dias_semana: [1, 3, 5], dia_prazo: 1, hora: '', prova: 'nenhuma', aprovacao: false, mentorados: p.paraPadrao ?? [], inicio: '', fim: '', checklist: [] }
}

export function EditorMissao(p: Props) {
  const [d, setD] = useState<DadosMissao>(() => inicial(p))
  const acao = useAcao()
  const todos = p.mentorados.length > 0 && p.mentorados.every((m) => d.mentorados.includes(m.id))

  return (
    <Modal aberto={p.aberto} aoFechar={() => !acao.pendente && p.aoFechar()} titulo={d.id ? 'Editar missão' : 'Nova missão'}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          acao.rodar(() => salvarMissao(d), p.aoSalvar)
        }}
      >
        <div>
          <Rotulo htmlFor="mi-titulo" dica={<p>O que ele precisa fazer, começando com verbo, com o resultado esperado.</p>} exemplo={<>“Subir o preço do corte para R$ 50” em vez de “Preço”.</>}>
            Missão
          </Rotulo>
          <input id="mi-titulo" className="tf-campo" autoFocus maxLength={140} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} placeholder="Ex.: Subir o preço do corte para R$ 50" />
        </div>
        <div>
          <label className="tf-rotulo" htmlFor="mi-desc">Como fazer (opcional)</label>
          <textarea id="mi-desc" className="tf-campo min-h-[88px] py-3" maxLength={2000} value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} placeholder="Passo a passo, padrão esperado, links de apoio…" />
        </div>

        <EditorChecklist itens={d.checklist ?? []} aoMudar={(v) => setD({ ...d, checklist: v })} />

        {/* prazo */}
        <div className="space-y-3">
          <span className="tf-rotulo">Prazo</span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['data', 'Uma vez', 'Até um dia'],
                ['dias', 'Nos dias', 'Repete na semana'],
                ['semanal', 'Toda semana', 'Uma entrega/semana'],
              ] as const
            ).map(([v, t, s]) => (
              <button
                key={v}
                type="button"
                aria-pressed={d.tipo === v}
                onClick={() => setD({ ...d, tipo: v })}
                className={`rounded-2xl border p-3 text-left transition ${d.tipo === v ? 'border-tf-marca bg-tf-marca-clara' : 'border-tf-borda'}`}
              >
                <span className="block text-sm font-extrabold">{t}</span>
                <span className="block text-xs text-tf-suave">{s}</span>
              </button>
            ))}
          </div>
          {d.tipo === 'data' && (
            <div>
              <label className="tf-rotulo" htmlFor="mi-data">Entregar até</label>
              <input id="mi-data" type="date" className="tf-campo max-w-[200px]" min={d.id ? undefined : p.hoje} value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} />
            </div>
          )}
          {d.tipo === 'dias' && (
            <div>
              <span className="tf-rotulo">Em quais dias (cada dia é uma entrega)</span>
              <ChipsDias valor={d.dias_semana} aoMudar={(v) => setD({ ...d, dias_semana: v })} />
              <p className="mt-1 text-sm text-tf-suave">Ex.: “Postar 3 stories” seg, qua e sex.</p>
            </div>
          )}
          {d.tipo === 'semanal' && (
            <div>
              <label className="tf-rotulo" htmlFor="mi-dia">Entregar toda semana até</label>
              <select id="mi-dia" className="tf-campo max-w-[200px]" value={d.dia_prazo ?? 1} onChange={(e) => setD({ ...d, dia_prazo: Number(e.target.value) })}>
                {NOMES.map((n, i) => (
                  <option key={i} value={i}>
                    {n}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-tf-suave">Ex.: “Mandar o faturamento da semana” toda segunda.</p>
            </div>
          )}
          {d.tipo !== 'data' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tf-rotulo" htmlFor="mi-inicio">Começa em (opcional)</label>
                <input id="mi-inicio" type="date" className="tf-campo" min={d.id ? undefined : p.hoje} value={d.inicio ?? ''} onChange={(e) => setD({ ...d, inicio: e.target.value })} />
              </div>
              <div>
                <label className="tf-rotulo" htmlFor="mi-fim">Termina em (opcional)</label>
                <input id="mi-fim" type="date" className="tf-campo" min={d.inicio || p.hoje} value={d.fim ?? ''} onChange={(e) => setD({ ...d, fim: e.target.value })} />
              </div>
              <p className="col-span-2 -mt-1 text-sm text-tf-suave">Ex.: método novo de agenda a partir da semana que vem, por 4 semanas.</p>
            </div>
          )}
          <div>
            <label className="tf-rotulo" htmlFor="mi-hora">Até que horas (opcional)</label>
            <input id="mi-hora" type="time" className="tf-campo max-w-[160px]" value={d.hora} onChange={(e) => setD({ ...d, hora: e.target.value })} />
          </div>
        </div>

        {/* prova */}
        <div>
          <Rotulo dica={<p>O que ele manda para provar que fez. Sem prova, basta marcar como feito.</p>} exemplo={<>Foto da tabela de preços nova na parede; texto com “o que aprendi no curso”.</>}>
            Prova de entrega
          </Rotulo>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['nenhuma', 'Nenhuma'],
                ['foto', 'Foto ou print'],
                ['texto', 'Texto'],
              ] as const
            ).map(([v, t]) => (
              <button
                key={v}
                type="button"
                aria-pressed={d.prova === v}
                onClick={() => setD({ ...d, prova: v })}
                className={`min-h-[48px] rounded-xl border text-sm font-extrabold ${d.prova === v ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Interruptor
          rotulo="Precisa da minha aprovação"
          descricao={d.aprovacao ? 'Fica “aguardando você”: aprove ou devolva com o motivo.' : 'Entregou, está concluída.'}
          ligado={d.aprovacao}
          aoMudar={(v) => setD({ ...d, aprovacao: v })}
        />

        {/* para quem */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="tf-rotulo !mb-0">Para quem</span>
            {p.mentorados.length > 1 && (
              <button type="button" className="text-sm font-bold text-tf-marca-texto" onClick={() => setD({ ...d, mentorados: todos ? [] : p.mentorados.map((m) => m.id) })}>
                {todos ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {p.mentorados.map((m) => {
              const sel = d.mentorados.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setD({ ...d, mentorados: sel ? d.mentorados.filter((x) => x !== m.id) : [...d.mentorados, m.id] })}
                  className={`min-h-[40px] rounded-full border px-4 text-sm font-bold ${sel ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-tf-suave'}`}
                >
                  {sel ? '✓ ' : ''}
                  {m.nome.split(' ')[0]}
                </button>
              )
            })}
          </div>
          {d.mentorados.length > 1 && <p className="mt-1 text-sm text-tf-suave">Cada um recebe a própria missão para entregar.</p>}
          {d.mentorados.length === 0 && <p className="mt-1 text-sm text-tf-suave">Sem ninguém marcado, a missão fica guardada na biblioteca para vincular depois.</p>}
          {d.id && <p className="mt-1 text-sm text-tf-suave">Editar muda a missão para todos que a recebem; o que já foi entregue fica como estava.</p>}
        </div>

        <Erro texto={acao.erro} />
        <button type="submit" className="tf-botao w-full" disabled={acao.pendente}>
          {acao.pendente ? 'Salvando…' : d.mentorados.length === 0 ? 'Salvar na biblioteca (sem mentorado)' : d.id ? 'Salvar missão' : `Criar missão${d.mentorados.length > 1 ? ` para ${d.mentorados.length}` : ''}`}
        </button>
      </form>
    </Modal>
  )
}
