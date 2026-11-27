'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { marcar, salvarObservacao } from './actions'

type Item = {
  id: string
  titulo: string
  descricao: string | null
  feito: boolean
  kit: { titulo: string; url: string } | null
  observacao: string | null
}

export default function Checklist({ titulo, tipo, itens, vazio }: { titulo: string; tipo: 'habito_diario' | 'missao_semana'; itens: Item[]; vazio: string }) {
  const [feitos, setFeitos] = useState<Record<string, boolean>>(Object.fromEntries(itens.map((i) => [i.id, i.feito])))
  const total = itens.length
  const marcados = itens.filter((i) => feitos[i.id]).length

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{titulo}</h2>
        {total > 0 && <span className="font-black text-latao">{marcados}/{total}</span>}
      </div>
      {total === 0 ? (
        <p className="text-suave">{vazio}</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((i) => (
            <Linha key={i.id} item={i} tipo={tipo} feito={!!feitos[i.id]} setFeito={(v) => setFeitos((f) => ({ ...f, [i.id]: v }))} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Linha({ item, tipo, feito, setFeito }: { item: Item; tipo: 'habito_diario' | 'missao_semana'; feito: boolean; setFeito: (v: boolean) => void }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [obs, setObs] = useState(item.observacao ?? '')
  const [obsSalva, setObsSalva] = useState(item.observacao ?? '')
  const [erro, setErro] = useState('')

  function alternar() {
    const novo = !feito
    setFeito(novo)
    setErro('')
    iniciar(async () => {
      try {
        await marcar(item.id, tipo, novo)
        router.refresh()
      } catch (e) {
        setFeito(!novo)
        setErro((e as Error).message)
      }
    })
  }

  return (
    <li className={`rounded-xl border p-4 transition ${feito ? 'border-ok/50 bg-ok/5' : 'border-linha bg-card-2'}`}>
      <button type="button" onClick={alternar} disabled={pendente} className="flex w-full items-start gap-4 text-left" aria-pressed={feito}>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 text-lg font-black ${feito ? 'border-ok bg-ok text-fundo' : 'border-suave/50'}`}
          aria-hidden
        >
          {feito ? '✓' : ''}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-lg font-semibold leading-snug ${feito ? 'text-texto/70 line-through decoration-ok/60' : ''}`}>{item.titulo}</span>
          {item.descricao && <span className="mt-1 block whitespace-pre-line text-base text-suave">{item.descricao}</span>}
        </span>
      </button>
      {item.kit?.url && (
        <a href={item.kit.url} target="_blank" rel="noreferrer" className="btn-sm mt-3 border border-latao/50 text-latao">
          📄 Kit: {item.kit.titulo}
        </a>
      )}
      {tipo === 'missao_semana' && (
        <div className="mt-3">
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            onBlur={() => {
              if (obs === obsSalva) return
              iniciar(async () => {
                try {
                  await salvarObservacao(item.id, obs)
                  setObsSalva(obs)
                  if (obs.trim()) setFeito(true)
                  router.refresh()
                } catch (e) {
                  setErro((e as Error).message)
                }
              })
            }}
            rows={2}
            placeholder="Observação (opcional): como foi, o que travou..."
            className="campo py-2.5 text-base"
          />
          {obs !== obsSalva && <p className="mt-1 text-xs text-suave">Sai do campo pra salvar.</p>}
        </div>
      )}
      {erro && <p className="erro">{erro}</p>}
    </li>
  )
}
