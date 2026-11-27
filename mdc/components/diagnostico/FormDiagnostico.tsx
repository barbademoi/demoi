'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Escolha from '@/components/Escolha'
import { mascaraWhatsapp } from '@/lib/format'
import { ETAPAS_90DIAS, ETAPAS_ENTRADA, UFS_OPCOES, validarEtapa, visivel, type Pergunta, type Respostas } from '@/lib/diagnostico'
import { salvarDiagnostico } from './actions'

function lerRascunho(chave: string): { r: Respostas; etapa: number } | null {
  try {
    const s = window.localStorage.getItem(chave)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}
function gravarRascunho(chave: string, valor: unknown) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    /* modo anônimo / armazenamento cheio: segue sem rascunho */
  }
}
function apagarRascunho(chave: string) {
  try {
    window.localStorage.removeItem(chave)
  } catch {
    /* nada */
  }
}

export default function FormDiagnostico({
  tipo,
  userId,
  inicial,
}: {
  tipo: 'entrada' | '90dias'
  userId: string
  inicial: Respostas
}) {
  const etapas = tipo === 'entrada' ? ETAPAS_ENTRADA : ETAPAS_90DIAS
  const chave = `mdc-diagnostico-${tipo}-${userId}`
  const router = useRouter()
  const topo = useRef<HTMLDivElement>(null)
  const [r, setR] = useState<Respostas>(inicial)
  const [etapa, setEtapa] = useState(0)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [mensagem, setMensagem] = useState('')
  const [carregado, setCarregado] = useState(false)
  const [pendente, iniciar] = useTransition()

  useEffect(() => {
    const salvo = lerRascunho(chave)
    if (salvo) {
      setR({ ...inicial, ...salvo.r })
      setEtapa(Math.min(Math.max(0, salvo.etapa || 0), etapas.length - 1))
    }
    setCarregado(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (carregado) gravarRascunho(chave, { r, etapa })
  }, [r, etapa, carregado, chave])

  const atual = etapas[etapa]
  const ultima = etapa === etapas.length - 1
  const set = (id: string, v: Respostas[string]) => {
    setR((x) => ({ ...x, [id]: v }))
    if (erros[id]) setErros((e) => ({ ...e, [id]: '' }))
  }

  function irPara(n: number) {
    setEtapa(n)
    setErros({})
    setMensagem('')
    topo.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function avancar() {
    const e = validarEtapa(atual, r)
    if (Object.keys(e).length) {
      setErros(e)
      setMensagem('Confere os campos marcados.')
      return
    }
    if (!ultima) return irPara(etapa + 1)
    iniciar(async () => {
      const res = await salvarDiagnostico(tipo, r)
      if (!res.ok) {
        setMensagem(res.erro ?? 'Não deu pra salvar. Tenta de novo.')
        if (res.etapa !== undefined) {
          setEtapa(res.etapa)
          setErros(res.erros ?? {})
        }
        return
      }
      apagarRascunho(chave)
      router.push(tipo === 'entrada' ? '/app?boas-vindas=1' : '/app?reavaliacao=1')
      router.refresh()
    })
  }

  const progresso = Math.round(((etapa + 1) / etapas.length) * 100)

  return (
    <div ref={topo} className="scroll-mt-4">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-suave">
          <span>Etapa {etapa + 1} de {etapas.length}</span>
          <span>{progresso}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-linha">
          <div className="h-full rounded-full bg-latao transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-black">{atual.titulo}</h2>

      <div className="space-y-7">
        {atual.perguntas.filter((p) => visivel(p, r)).map((p) => (
          <CampoPergunta key={p.id} p={p} valor={r[p.id]} onChange={(v) => set(p.id, v)} erro={erros[p.id]} />
        ))}
      </div>

      {mensagem && <p className="mt-6 rounded-xl bg-perigo/10 p-4 text-perigo">{mensagem}</p>}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {etapa > 0 ? (
          <button type="button" onClick={() => irPara(etapa - 1)} className="btn-secundario">Voltar</button>
        ) : (
          <span />
        )}
        <button type="button" onClick={avancar} disabled={pendente} className="btn-primario">
          {pendente ? 'Salvando...' : ultima ? 'Enviar' : 'Continuar'}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-suave">Suas respostas ficam salvas neste aparelho até você enviar.</p>
    </div>
  )
}

function CampoPergunta({
  p,
  valor,
  onChange,
  erro,
}: {
  p: Pergunta
  valor: Respostas[string]
  onChange: (v: Respostas[string]) => void
  erro?: string
}) {
  const id = `q-${p.id}`
  const rot = (
    <span>
      {p.rotulo}
      {p.obrigatorio && p.tipo !== 'aceite' ? ' *' : ''}
    </span>
  )
  let campo: React.ReactNode
  const s = typeof valor === 'string' ? valor : valor === null || valor === undefined ? '' : String(valor)

  switch (p.tipo) {
    case 'unica':
      campo = <Escolha nome={p.id} opcoes={p.opcoes!} valor={s} onChange={(v) => onChange(v as string)} colunas={p.opcoes!.length > 3 ? 2 : 1} />
      break
    case 'multipla':
      campo = (
        <Escolha nome={p.id} opcoes={p.opcoes!} valor={Array.isArray(valor) ? valor : []} onChange={(v) => onChange(v as string[])} multiplo max={p.max} colunas={2} />
      )
      break
    case 'escala':
      campo = (
        <div className="flex gap-2">
          {['1', '2', '3', '4', '5'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={s === n}
              className={`h-14 flex-1 rounded-xl border text-xl font-bold ${s === n ? 'border-latao bg-latao text-fundo' : 'border-linha bg-card-2'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )
      break
    case 'uf':
      campo = (
        <select id={id} className="campo" value={s} onChange={(e) => onChange(e.target.value)}>
          <option value="">Escolha</option>
          {UFS_OPCOES.map((u) => (
            <option key={u.valor} value={u.valor}>{u.rotulo}</option>
          ))}
        </select>
      )
      break
    case 'area':
      campo = <textarea id={id} className="campo" rows={4} value={s} onChange={(e) => onChange(e.target.value)} placeholder={p.placeholder} />
      break
    case 'aceite':
      return (
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-base">
            <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[#D9A441]" checked={valor === true} onChange={(e) => onChange(e.target.checked)} />
            <span>{p.rotulo} *</span>
          </label>
          {erro && <p className="erro">{erro}</p>}
        </div>
      )
    case 'whatsapp':
      campo = <input id={id} className="campo" inputMode="numeric" value={mascaraWhatsapp(s)} onChange={(e) => onChange(mascaraWhatsapp(e.target.value))} placeholder="(35) 99999-9999" />
      break
    case 'numero':
      campo = <input id={id} className="campo" inputMode="numeric" value={s} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} />
      break
    case 'moeda':
      campo = (
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave">R$</span>
          <input id={id} className="campo pl-12" inputMode="decimal" value={s} onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, '').slice(0, 12))} placeholder="0,00" />
        </div>
      )
      break
    default:
      campo = <input id={id} className="campo" value={s} onChange={(e) => onChange(e.target.value)} placeholder={p.placeholder} />
  }

  const ehGrupo = p.tipo === 'unica' || p.tipo === 'multipla' || p.tipo === 'escala'
  return (
    <div>
      {ehGrupo ? <p className="rotulo">{rot}</p> : <label htmlFor={id} className="rotulo">{rot}</label>}
      {campo}
      {p.ajuda && <p className="ajuda">{p.ajuda}</p>}
      {erro && <p className="erro">{erro}</p>}
    </div>
  )
}
