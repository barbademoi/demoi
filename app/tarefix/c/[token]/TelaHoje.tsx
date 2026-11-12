'use client'

import { useEffect, useRef, useState } from 'react'
import { createTarefixClient } from '@/lib/tarefix/supabase/client'
import { comprimirImagem } from '@/lib/tarefix/imagem'
import { dataPorExtenso, FUSO } from '@/lib/tarefix/datas'
import type { EstadoHoje, TarefaTela } from '@/lib/tarefix/estadoHoje'
import { Avatar, Erro, Modal } from '@/components/tarefix/ui'
import { Termometro } from '@/components/tarefix/Termometro'
import { escolherMomento, preencher, sortearMensagem, variaveisDa, type Momento } from '@/lib/tarefix/mensagens'
import { desmarcarTarefa, marcarTarefa, prepararUpload, registrarExtra } from './acoes'
import { MeuMes } from './MeuMes'
import { duracao, eAgora, estaAtrasada, janela, minutosDeAtraso, prazoEfetivo } from '@/lib/tarefix/prazo'
import { AUTOAVALIACAO, liberacaoContinuas, rotuloAutoavaliacao } from '@/lib/tarefix/continuas'
import { BotaoTema } from '@/components/tarefix/Tema'
import { DicaInstalar } from '@/components/tarefix/DicaInstalar'

type Props = {
  token: string
  colaborador: { nome: string; foto_url: string | null; funcao: string | null }
  empresa: { nome: string; logo_url: string | null; fecha: string; fechaHorario: string }
  inicial: EstadoHoje
}

const horaSP = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

function saudacao() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function IconeCamera({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

/** Mensagens já mostradas hoje neste aparelho (para não repetir no mesmo dia). */
function lerUsadas(chave: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? '[]')
  } catch {
    return []
  }
}
function guardarUsada(chave: string, modelo: string) {
  try {
    const lista = lerUsadas(chave)
    if (!lista.includes(modelo)) localStorage.setItem(chave, JSON.stringify([...lista, modelo].slice(-80)))
  } catch {
    /* sem localStorage: tudo bem, só pode repetir */
  }
}

async function soltarConfete() {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const confetti = (await import('canvas-confetti')).default
  const cores = ['#5B3DF5', '#8B74FF', '#F5A524', '#2DB960', '#FFFFFF']
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 }, colors: cores, disableForReducedMotion: true })
  setTimeout(() => confetti({ particleCount: 80, spread: 110, origin: { y: 0.6 }, colors: cores, disableForReducedMotion: true }), 250)
}

/** Recalcula o termômetro do dia na hora do toque (o servidor confirma em seguida). */
function comTarefa(e: EstadoHoje, id: string, mudanca: Partial<TarefaTela>): EstadoHoje {
  const tarefas = e.tarefas.map((x) => (x.id === id ? { ...x, ...mudanca } : x))
  const feitas = tarefas.filter((t) => t.status === 'feita')
  const pesoTotal = tarefas.reduce((n, t) => n + (t.peso || 1), 0)
  const pesoFeito = feitas.reduce((n, t) => n + (t.peso || 1), 0)
  return {
    ...e,
    tarefas,
    // o termômetro do mês o servidor confirma em seguida
    dia: tarefas.length ? { feitas: feitas.length, total: tarefas.length, percentual: Math.round((pesoFeito / pesoTotal) * 100) } : null,
  }
}

/** Envia a foto direto ao Storage (bucket privado) por uma URL assinada pelo servidor. */
async function enviarFoto(token: string, arquivo: File): Promise<string> {
  const blob = await comprimirImagem(arquivo, 1280, 0.7)
  const prep = await prepararUpload(token)
  if (!prep.ok) throw new Error(prep.erro)
  const { error } = await createTarefixClient()
    .storage.from('tarefix-provas')
    .uploadToSignedUrl(prep.caminho, prep.tokenUpload, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error('Não consegui enviar a foto. Confira a internet e tente de novo.')
  return prep.caminho
}

export function TelaHoje({ token, colaborador, empresa, inicial }: Props) {
  const [estado, setEstado] = useState(inicial)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [fotoAberta, setFotoAberta] = useState<string | null>(null)
  const camera = useRef<HTMLInputElement>(null)
  const tarefaDaFoto = useRef<string | null>(null)

  const primeiroNome = colaborador.nome.split(' ')[0]
  const fechado = estado.fechado
  const pendentes = estado.tarefas.filter((t) => t.status !== 'feita').length
  const [aba, setAba] = useState<'hoje' | 'mes'>('hoje')

  /* ----------------------- relógio (minutos p/ fechar) ----------------------- */
  const recebidoEm = useRef(Date.now())
  const [, setTick] = useState(0)
  useEffect(() => {
    recebidoEm.current = Date.now()
  }, [estado])
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  const minutosRestantes = estado.minutosParaFechar - Math.floor((Date.now() - recebidoEm.current) / 60_000)

  /* ------------------------------- mensagens ------------------------------- */
  const chaveUsadas = `tfx-msg-${token.slice(0, 10)}-${estado.hoje}`
  const reprovadas = estado.tarefas.filter((t) => t.status === 'reprovada').map((t) => ({ motivo: t.motivo_reprovacao ?? '' }))
  const situacao = {
    total: estado.tarefas.length,
    feitas: estado.dia?.feitas ?? 0,
    reprovadas,
    fechado,
    minutosParaFechar: minutosRestantes,
    sequencia: estado.sequencia,
    evolucao: estado.evolucao,
    faltaBonus: estado.bonus?.falta ?? null,
  }
  const momento = estado.folga ? null : escolherMomento(situacao)
  const [mensagem, setMensagem] = useState<{ momento: Momento; modelo: string } | null>(null)
  const [transitoria, setTransitoria] = useState<{ momento: Momento; modelo: string } | null>(null)

  // sorteia quando o momento muda (no cliente, para poder evitar repetidas do dia)
  useEffect(() => {
    if (!momento) return setMensagem(null)
    setMensagem((atual) => {
      if (atual?.momento === momento) return atual
      const modelo = sortearMensagem(momento, estado.tom, lerUsadas(chaveUsadas))
      guardarUsada(chaveUsadas, modelo)
      return { momento, modelo }
    })
  }, [momento, estado.tom, chaveUsadas])

  function mostrarTransitoria(m: Momento) {
    const modelo = sortearMensagem(m, estado.tom, lerUsadas(chaveUsadas))
    guardarUsada(chaveUsadas, modelo)
    setTransitoria({ momento: m, modelo })
    setTimeout(() => setTransitoria((t) => (t?.modelo === modelo ? null : t)), 6000)
  }

  const exibida = transitoria ?? mensagem
  const textoMensagem = exibida ? preencher(exibida.modelo, variaveisDa(situacao, primeiroNome)) : null

  /* ------------------------------- comemoração ------------------------------- */
  const pctAnterior = useRef<number | null>(inicial.dia?.percentual ?? null)
  useEffect(() => {
    const agora = estado.dia?.percentual ?? null
    if (agora === 100 && pctAnterior.current !== null && pctAnterior.current < 100) soltarConfete()
    pctAnterior.current = agora
  }, [estado.dia?.percentual])

  // Trava a tela sozinha quando dá o horário (o servidor também recusa).
  useEffect(() => {
    if (fechado || estado.minutosParaFechar <= 0) return
    const id = setTimeout(() => setEstado((e) => ({ ...e, fechado: true, minutosParaFechar: 0 })), estado.minutosParaFechar * 60_000)
    return () => clearTimeout(id)
  }, [fechado, estado.minutosParaFechar])

  /** Aplica a resposta do servidor; se ele recusar sem mandar estado novo, desfaz o otimista. */
  async function aplicar(p: Promise<{ ok: boolean; erro?: string; estado?: EstadoHoje }>, anterior?: EstadoHoje) {
    try {
      const r = await p
      if (r.estado) setEstado(r.estado)
      else if (!r.ok && anterior) setEstado(anterior)
      if (!r.ok) setErro(r.erro ?? 'Algo deu errado.')
    } catch {
      if (anterior) setEstado(anterior)
      setErro('Sem conexão. Confira a internet e tente de novo.')
    }
  }

  /* ------------------------ tarefas do dia todo ------------------------ */
  const continuasLiberadas = minutosRestantes <= estado.liberarContinuasMin
  const horaLiberacao = liberacaoContinuas(empresa.fechaHorario, estado.liberarContinuasMin)
  const [avaliando, setAvaliando] = useState<{ tarefa: TarefaTela; nota: number } | null>(null)
  const notaDaFoto = useRef<number | undefined>(undefined)

  async function confirmarContinua() {
    if (!avaliando) return
    const { tarefa: t, nota } = avaliando
    setAvaliando(null)
    if (t.exige_foto) {
      tarefaDaFoto.current = t.id
      notaDaFoto.current = nota
      camera.current?.click()
      return
    }
    setOcupada(t.id)
    const anterior = estado
    setEstado((e) => comTarefa(e, t.id, { status: 'feita', feita_em: new Date().toISOString(), autoavaliacao: nota }))
    await aplicar(marcarTarefa(token, t.id, undefined, nota), anterior).finally(() => setOcupada(null))
  }

  async function tocar(t: TarefaTela) {
    if (fechado || ocupada) return
    setErro(null)
    if (t.continua && t.status !== 'feita') {
      if (!continuasLiberadas) return setErro(`"${t.titulo}" vale o dia todo: a confirmação libera às ${horaLiberacao}.`)
      setAvaliando({ tarefa: t, nota: 4 })
      return
    }
    if (t.status === 'feita') {
      if (t.foto_url && !confirm('Desmarcar esta tarefa? A foto enviada será apagada.')) return
      setOcupada(t.id)
      const anterior = estado
      setEstado((e) => comTarefa(e, t.id, { status: 'pendente', foto_url: null, feita_em: null, autoavaliacao: null }))
      await aplicar(desmarcarTarefa(token, t.id), anterior).finally(() => setOcupada(null))
      return
    }
    if (t.exige_foto) {
      tarefaDaFoto.current = t.id
      camera.current?.click()
      return
    }
    setOcupada(t.id)
    const anterior = estado
    setEstado((e) => comTarefa(e, t.id, { status: 'feita', feita_em: new Date().toISOString() }))
    await aplicar(marcarTarefa(token, t.id), anterior).finally(() => setOcupada(null))
  }

  async function fotoEscolhida(arquivo: File) {
    const id = tarefaDaFoto.current
    tarefaDaFoto.current = null
    if (!id) return
    setOcupada(id)
    setErro(null)
    try {
      const caminho = await enviarFoto(token, arquivo)
      const nota = notaDaFoto.current
      notaDaFoto.current = undefined
      const r = await marcarTarefa(token, id, caminho, nota)
      if (r.estado) setEstado(r.estado)
      if (!r.ok) setErro(r.erro)
      else if (r.estado?.dia?.percentual !== 100) mostrarTransitoria('foto_enviada')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui enviar a foto.')
    } finally {
      setOcupada(null)
    }
  }

  /* ------------------------------ extras ------------------------------ */
  const [extraAberta, setExtraAberta] = useState(false)
  const [extraTexto, setExtraTexto] = useState('')
  const [extraFoto, setExtraFoto] = useState<File | null>(null)
  const [extraEnviando, setExtraEnviando] = useState(false)
  const [extraErro, setExtraErro] = useState<string | null>(null)
  const extraCamera = useRef<HTMLInputElement>(null)

  async function enviarExtra() {
    setExtraErro(null)
    setExtraEnviando(true)
    try {
      const caminho = extraFoto ? await enviarFoto(token, extraFoto) : undefined
      const r = await registrarExtra(token, extraTexto, caminho)
      if (r.estado) setEstado(r.estado)
      if (!r.ok) return setExtraErro(r.erro)
      setExtraAberta(false)
      setExtraTexto('')
      setExtraFoto(null)
      mostrarTransitoria('extra')
    } catch (e) {
      setExtraErro(e instanceof Error ? e.message : 'Não consegui registrar.')
    } finally {
      setExtraEnviando(false)
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
      {/* Cabeçalho */}
      <header className="flex items-center gap-4">
        <Avatar nome={colaborador.nome} url={colaborador.foto_url} tamanho={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{colaborador.nome}</h1>
          <p className="truncate text-sm text-tf-suave">{[colaborador.funcao, empresa.nome].filter(Boolean).join(' · ')}</p>
        </div>
        {empresa.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={empresa.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
        )}
        <BotaoTema />
      </header>

      <DicaInstalar />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-bold first-letter:uppercase">{dataPorExtenso(estado.hoje)}</span>
        <span className={`rounded-full px-3 py-1 font-bold ${fechado ? 'bg-tf-texto text-tf-fundo' : 'bg-tf-marca-clara text-tf-marca-texto'}`}>
          {fechado ? `Dia fechado às ${empresa.fecha}` : `Fecha às ${empresa.fecha}`}
        </span>
      </div>

      {/* Abas */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-tf-card p-1" role="tablist">
        {(
          [
            ['hoje', 'Hoje'],
            ['mes', 'Meu mês'],
          ] as const
        ).map(([v, r]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={aba === v}
            onClick={() => setAba(v)}
            className={`min-h-[44px] rounded-xl font-bold transition ${aba === v ? 'bg-tf-marca text-white' : 'text-tf-suave'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {aba === 'mes' ? (
        <div className="mt-5">
          <MeuMes estado={estado} />
        </div>
      ) : (
      <>
      {/* Mensagem do topo (banco com sorteio em lib/tarefix/mensagens.ts) */}
      <p className="mt-5 min-h-[2.5em] text-2xl font-extrabold leading-tight tracking-tight" aria-live="polite">
        {estado.folga
          ? `Hoje é folga, ${primeiroNome}. Bom descanso!`
          : estado.tarefas.length === 0
            ? `${saudacao()}, ${primeiroNome}! Nenhuma tarefa para hoje.`
            : textoMensagem ?? `${saudacao()}, ${primeiroNome}!`}
      </p>

      {/* Termômetros */}
      <section className="tf-cartao mt-5 space-y-5 p-5">
        <Termometro rotulo="Hoje" percentual={estado.dia?.percentual ?? null} detalhe={estado.dia ? `${estado.dia.feitas} de ${estado.dia.total}` : undefined} grande />
        <Termometro rotulo="No mês" percentual={estado.mes?.percentual ?? null} detalhe={estado.extrasAprovadasMes ? `+${estado.extrasAprovadasMes} extra${estado.extrasAprovadasMes > 1 ? 's' : ''} aprovada${estado.extrasAprovadasMes > 1 ? 's' : ''}` : undefined} />
        {(() => {
          const previsto = estado.tarefas.filter((t) => t.status !== 'feita').reduce((n, t) => n + (t.tempo_estimado_min ?? 0), 0)
          return !fechado && previsto > 0 ? (
            <p className="text-sm text-tf-suave">
              Tempo previsto das pendentes: <b className="text-tf-texto">{duracao(previsto)}</b>
            </p>
          ) : null
        })()}
        {estado.bonus && (estado.bonus.proximo || estado.bonus.atingido) && (
          <p className="rounded-xl bg-tf-marca-clara px-4 py-3 text-sm font-bold text-tf-marca-texto">
            {estado.bonus.proximo && estado.bonus.falta !== null
              ? `Faltam ${estado.bonus.falta}% no mês para ${estado.bonus.atingido ? 'o próximo bônus' : 'o bônus'}: ${estado.bonus.proximo.premio}.`
              : `Bônus de ${estado.bonus.atingido!.premio} garantido até agora.`}
          </p>
        )}
      </section>

      {!fechado && pendentes > 0 && minutosRestantes > 0 && minutosRestantes <= 60 && momento !== 'perto_fechamento' && (
        <p className="mt-4 rounded-2xl bg-tf-marca-clara px-4 py-3 font-bold text-tf-marca-texto">
          Faltam {minutosRestantes} min para fechar e {pendentes} tarefa{pendentes > 1 ? 's' : ''} pendente{pendentes > 1 ? 's' : ''}.
        </p>
      )}

      <div className="mt-4">
        <Erro texto={erro} />
      </div>

      {/* Tarefas do dia todo: fixas no topo, com cor e peso próprios */}
      {estado.tarefas.some((t) => t.continua) && (
        <section className="mt-4 overflow-hidden rounded-2xl bg-tf-marca text-white">
          <div className="px-4 pb-2 pt-4">
            <h2 className="text-lg font-extrabold">Durante o dia todo</h2>
            <p className="text-sm text-white/85">
              {estado.tom === 'zoeira'
                ? 'Essas não têm check rápido: valem o dia inteiro e pesam mais. Capricha do primeiro ao último cliente.'
                : 'Estas tarefas valem durante todo o dia e têm peso maior no seu resultado.'}
            </p>
          </div>
          <ul className="divide-y divide-white/15">
            {estado.tarefas
              .filter((t) => t.continua)
              .map((t) => {
                const feita = t.status === 'feita'
                return (
                  <li key={t.id} className="flex items-center gap-4 px-4 py-4">
                    <button
                      type="button"
                      onClick={() => tocar(t)}
                      disabled={fechado || Boolean(ocupada)}
                      aria-pressed={feita}
                      aria-label={`${feita ? 'Desmarcar' : 'Confirmar'} ${t.titulo}`}
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] transition active:scale-90 ${
                        feita ? 'border-white bg-white text-tf-marca' : continuasLiberadas ? 'border-white bg-white/10' : 'border-white/40 bg-white/5'
                      } ${fechado ? 'opacity-60' : ''}`}
                    >
                      {ocupada === t.id ? (
                        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
                      ) : feita ? (
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      ) : !continuasLiberadas ? (
                        <svg viewBox="0 0 24 24" className="h-6 w-6 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 018 0v4" />
                        </svg>
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-lg font-extrabold leading-snug ${feita ? 'line-through decoration-2 opacity-80' : ''}`}>{t.titulo}</p>
                      {t.descricao && <p className="mt-0.5 text-sm text-white/80">{t.descricao}</p>}
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/85">
                        {t.peso > 1 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-tf-marca">vale {t.peso}×</span>}
                        {t.status === 'reprovada' && t.motivo_reprovacao && <span className="font-bold">Voltou: “{t.motivo_reprovacao}”</span>}
                        {feita
                          ? `confirmada${t.feita_em ? ` às ${horaSP(t.feita_em)}` : ''}${rotuloAutoavaliacao(t.autoavaliacao) ? ` · você: ${rotuloAutoavaliacao(t.autoavaliacao)}` : ''}`
                          : continuasLiberadas
                            ? 'Toque para confirmar e dizer como foi'
                            : `confirma a partir das ${horaLiberacao}`}
                      </p>
                    </div>
                  </li>
                )
              })}
          </ul>
        </section>
      )}

      {/* Lista de tarefas */}
      {estado.tarefas.some((t) => !t.continua) && (
        <ul className="mt-4 space-y-3">
          {estado.tarefas.filter((t) => !t.continua).map((t) => {
            const feita = t.status === 'feita'
            const reprovada = t.status === 'reprovada'
            const carregando = ocupada === t.id
            return (
              <li key={t.id} className={`tf-cartao overflow-hidden ${reprovada ? '!border-tf-texto' : eAgora(t, estado.hoje) && !fechado ? '!border-2 !border-tf-marca' : ''}`}>
                {reprovada && t.motivo_reprovacao && (
                  <div className="bg-tf-texto px-4 py-3 text-sm font-bold text-tf-fundo">
                    Uma tarefa voltou: “{t.motivo_reprovacao}”. Bora acertar.
                  </div>
                )}
                <div className="flex items-center gap-4 p-4">
                  <button
                    type="button"
                    onClick={() => tocar(t)}
                    disabled={fechado || Boolean(ocupada)}
                    aria-pressed={feita}
                    aria-label={`${feita ? 'Desmarcar' : 'Marcar'} ${t.titulo}`}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] transition active:scale-90 ${
                      feita ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda bg-tf-fundo text-tf-marca-texto'
                    } ${fechado ? 'opacity-60' : ''}`}
                  >
                    {carregando ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
                    ) : feita ? (
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    ) : t.exige_foto ? (
                      <IconeCamera className="h-7 w-7" />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-lg font-bold leading-snug ${feita ? 'text-tf-suave line-through decoration-2' : ''}`}>{t.titulo}</p>
                    {t.descricao && <p className="mt-0.5 text-sm text-tf-suave">{t.descricao}</p>}
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-tf-suave">
                      {!feita && janela(t) && (
                        <span className="rounded-full bg-tf-marca-clara px-2 py-0.5 text-xs font-bold text-tf-marca-texto">{janela(t)}</span>
                      )}
                      {estaAtrasada(t, estado.hoje) ? (
                        <span className="rounded-full bg-tf-texto px-2 py-0.5 text-xs font-bold text-tf-fundo">atrasada · era até {prazoEfetivo(t)}</span>
                      ) : (
                        eAgora(t, estado.hoje) && <span className="rounded-full bg-tf-marca px-2 py-0.5 text-xs font-bold text-white">agora</span>
                      )}
                      {t.exige_foto && !feita && (
                        <span className="inline-flex items-center gap-1">
                          <IconeCamera className="h-4 w-4" /> precisa de foto
                        </span>
                      )}
                      {!feita && duracao(t.tempo_estimado_min) && <span>{duracao(t.tempo_estimado_min)}</span>}
                      {feita && t.feita_em && (
                        <span>
                          feita às {horaSP(t.feita_em)}
                          {minutosDeAtraso(t) > 0 && ` · ${minutosDeAtraso(t)} min depois do prazo`}
                        </span>
                      )}
                    </p>
                  </div>
                  {t.foto_url && (
                    <button type="button" onClick={() => setFotoAberta(t.foto_url)} className="shrink-0" aria-label="Ver foto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.foto_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {estado.folga && (
        <div className="tf-cartao mt-4 px-5 py-8 text-center text-tf-suave">Dia de folga não conta no mês.</div>
      )}

      {/* Extras */}
      {!estado.folga && (
        <section className="mt-6 space-y-3">
          <button
            type="button"
            className="tf-botao2 w-full"
            onClick={() => {
              setExtraErro(null)
              setExtraAberta(true)
            }}
          >
            + Registrar tarefa extra
          </button>
          {estado.extrasHoje.length > 0 && (
            <ul className="tf-cartao divide-y divide-tf-borda">
              {estado.extrasHoje.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 text-sm">{x.descricao}</span>
                  <span className="shrink-0 rounded-full bg-tf-marca-clara px-3 py-1 text-xs font-bold text-tf-marca-texto">
                    {x.status === 'pendente' ? 'Aguardando' : x.status === 'aprovada' ? 'Aprovada' : 'Não aprovada'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      </>
      )}

      {/* Câmera (abre direto no celular) */}
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) fotoEscolhida(f)
          else tarefaDaFoto.current = null
        }}
      />

      <Modal aberto={extraAberta} aoFechar={() => !extraEnviando && setExtraAberta(false)} titulo="Tarefa extra">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            enviarExtra()
          }}
        >
          <p className="text-tf-suave">Fez algo além da lista? Conte aqui. Quem cuida da equipe aprova depois.</p>
          <textarea
            className="tf-campo min-h-[110px] py-3"
            maxLength={500}
            autoFocus
            value={extraTexto}
            onChange={(e) => setExtraTexto(e.target.value)}
            placeholder="Ex.: Organizei o estoque do depósito"
            aria-label="O que você fez"
          />
          <div className="flex items-center gap-3">
            <button type="button" className="tf-botao2 min-h-[48px] flex-1" onClick={() => extraCamera.current?.click()} disabled={extraEnviando}>
              <IconeCamera /> {extraFoto ? 'Trocar foto' : 'Foto (opcional)'}
            </button>
            {extraFoto && (
              <button type="button" className="min-h-[48px] px-2 text-sm font-bold text-tf-suave" onClick={() => setExtraFoto(null)}>
                Tirar
              </button>
            )}
          </div>
          {extraFoto && <p className="text-sm text-tf-suave">Foto pronta para enviar.</p>}
          <input
            ref={extraCamera}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) setExtraFoto(f)
            }}
          />
          <Erro texto={extraErro} />
          <button type="submit" className="tf-botao w-full" disabled={extraEnviando || !extraTexto.trim()}>
            {extraEnviando ? 'Enviando…' : 'Registrar'}
          </button>
        </form>
      </Modal>

      <Modal aberto={avaliando !== null} aoFechar={() => setAvaliando(null)} titulo={avaliando?.tarefa.titulo ?? ''}>
        {avaliando && (
          <div className="space-y-5">
            <p className="text-tf-suave">Como foi o seu dia nesta tarefa? Só você e quem cuida da equipe veem. Não muda o seu percentual.</p>
            <div>
              <p className="mb-3 text-center text-2xl font-extrabold text-tf-marca-texto">{rotuloAutoavaliacao(avaliando.nota)}</p>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={avaliando.nota}
                onChange={(e) => setAvaliando({ ...avaliando, nota: Number(e.target.value) })}
                className="h-10 w-full cursor-pointer accent-[#5B3DF5]"
                aria-label="Autoavaliação"
                aria-valuetext={rotuloAutoavaliacao(avaliando.nota) ?? undefined}
              />
              <div className="mt-1 flex justify-between text-xs font-bold text-tf-suave">
                {AUTOAVALIACAO.map((a) => (
                  <span key={a.valor} className={a.valor === avaliando.nota ? 'text-tf-marca-texto' : ''}>
                    {a.rotulo}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" className="tf-botao w-full" onClick={confirmarContinua}>
              {avaliando.tarefa.exige_foto ? 'Confirmar e tirar foto' : 'Confirmar'}
            </button>
          </div>
        )}
      </Modal>

      <Modal aberto={fotoAberta !== null} aoFechar={() => setFotoAberta(null)} titulo="Foto enviada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {fotoAberta && <img src={fotoAberta} alt="Foto da tarefa" className="w-full rounded-2xl" />}
      </Modal>
    </main>
  )
}
