'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EntregaTela, Mentorado, Missao, Reuniao } from '@/lib/tarefix/mentoria'
import { Erro, Interruptor, Modal, resumoDias, useAcao, useAviso } from '@/components/tarefix/ui'
import { decidirEntrega, editarMentorado, excluirMissao, novoLinkMentorado, pausarMissao, removerReuniao, salvarReuniao, vincularMissoes, excluirAtrasadas } from '../acoes'
import { EditorMissao } from '../EditorMissao'
import { textoPrazo } from '@/lib/tarefix/mentoriaTexto'
import { textoPeriodo } from '@/lib/tarefix/periodo'
import { hojeSP } from '@/lib/tarefix/datas'

type Entrega = EntregaTela & { foto_url: string | null }
type MissaoPara = Missao & { para: string[] }
const NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const quandoBR = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export function regraMissao(m: Missao) {
  const hora = m.hora ? ` às ${m.hora.slice(0, 5)}` : ''
  if (m.tipo === 'data') return `Uma vez · até ${m.data!.split('-').reverse().slice(0, 2).join('/')}${hora}`
  const periodo = textoPeriodo(m, hojeSP()) ? ` · ${textoPeriodo(m, hojeSP())}` : ''
  if (m.tipo === 'dias') return `${resumoDias(m.dias_semana)}${hora}${periodo}`
  return `Toda semana · até ${NOMES[m.dia_prazo ?? 1]}${hora}${periodo}`
}

export function DetalheMentorado(p: {
  mentorado: Mentorado
  novo: boolean
  entregas: Entrega[]
  prazo: { total: number; ok: number; percentual: number | null }
  reuniao: Reuniao | null
  missoes: MissaoPara[]
  todos: { id: string; nome: string }[]
  /** Missões ativas da biblioteca que ele ainda não tem. */
  biblioteca: Missao[]
  hoje: string
  /** Visor de engajamento (montado no servidor). */
  engajamento?: React.ReactNode
}) {
  const router = useRouter()
  const aviso = useAviso()
  const acao = useAcao()
  const [origem, setOrigem] = useState('')
  useEffect(() => setOrigem(window.location.origin), [])
  const m = p.mentorado
  const primeiro = m.nome.split(' ')[0]
  const link = `${origem}/tarefix/m/${m.token}`
  const textoLink = `Oi, ${primeiro}! Este é o seu link da mentoria: lá estão as suas missões, os prazos e a nossa próxima reunião.\n${link}\n\nDica: abra e adicione à tela inicial do celular, e ative as notificações para receber os lembretes.`
  const zap = (t: string) => (m.whatsapp ? `https://wa.me/${m.whatsapp.length <= 11 ? `55${m.whatsapp}` : m.whatsapp}?text=${encodeURIComponent(t)}` : `https://wa.me/?text=${encodeURIComponent(t)}`)

  const [editando, setEditando] = useState<MissaoPara | null | 'nova'>(null)
  const [devolvendo, setDevolvendo] = useState<Entrega | null>(null)
  const [motivo, setMotivo] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [dados, setDados] = useState(false)
  const [fd, setFd] = useState({ nome: m.nome, whatsapp: m.whatsapp ?? '', ativo: m.ativo })
  const [reu, setReu] = useState({
    data: p.reuniao ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(p.reuniao.quando)) : '',
    hora: '',
    link: p.reuniao?.link ?? '',
  })
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false)
  const [bib, setBib] = useState(false)
  const [escolhidas, setEscolhidas] = useState<string[]>([])

  const pronto = (t: string) => () => {
    aviso.mostrar(t)
    router.refresh()
  }

  const grupos: { titulo: string; itens: Entrega[]; destaque?: boolean }[] = [
    { titulo: 'Para você aprovar', itens: p.entregas.filter((e) => e.situacao === 'aguardando'), destaque: true },
    { titulo: 'Atrasadas', itens: p.entregas.filter((e) => e.situacao === 'atrasada') },
    { titulo: 'Devolvidas (esperando ele refazer)', itens: p.entregas.filter((e) => e.situacao === 'devolvida') },
    { titulo: 'Hoje e próximas', itens: p.entregas.filter((e) => e.situacao === 'hoje' || e.situacao === 'proxima') },
  ]
  const concluidas = p.entregas.filter((e) => e.situacao === 'concluida' || e.situacao === 'fechada').reverse()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{m.nome}</h1>
          <p className="text-tf-suave">
            {!m.ativo ? 'Pausado: o link não abre' : p.prazo.total ? `${p.prazo.ok} de ${p.prazo.total} entregas no prazo` : 'Nenhuma entrega vencida ainda'}
          </p>
        </div>
        {p.prazo.percentual !== null && <span className="shrink-0 text-3xl font-black tabular-nums">{p.prazo.percentual}%</span>}
      </div>

      {p.novo && (
        <p className="tf-cartao !border-tf-marca p-4 text-sm">
          <b>Cadastrado!</b> Mande o link para {primeiro} e crie a primeira missão.
        </p>
      )}

      {p.engajamento}

      {/* link */}
      <section className="tf-cartao space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Link das missões</h2>
          <button type="button" className="text-sm font-bold text-tf-marca-texto" onClick={() => setDados(true)}>
            Editar dados
          </button>
        </div>
        <div className="break-all rounded-xl border border-tf-borda bg-tf-fundo px-4 py-3 font-mono text-xs text-tf-suave">{origem ? link : '…'}</div>
        <div className="grid grid-cols-2 gap-2 text-[15px] leading-tight">
          <a className={`tf-botao ${m.ativo ? '' : 'pointer-events-none opacity-50'}`} href={zap(textoLink)} target="_blank" rel="noreferrer">
            Enviar no WhatsApp
          </a>
          <button
            type="button"
            className="tf-botao2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                aviso.mostrar('Link copiado')
              } catch {
                prompt('Copie o link:', link)
              }
            }}
          >
            Copiar link
          </button>
        </div>
        <button
          type="button"
          className="text-sm font-bold text-tf-suave underline"
          onClick={() => confirm(`Gerar um link novo para ${primeiro}? O antigo para de funcionar na hora.`) && acao.rodar(() => novoLinkMentorado(m.id), pronto('Link novo gerado'))}
        >
          Gerar novo link
        </button>
      </section>

      {/* reunião */}
      <section className="tf-cartao space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Próxima reunião</h2>
        {p.reuniao && (
          <div className="rounded-2xl bg-tf-marca-clara p-4">
            <p className="font-extrabold first-letter:uppercase">{quandoBR(p.reuniao.quando)}</p>
            {p.reuniao.link && (
              <a href={p.reuniao.link} target="_blank" rel="noreferrer" className="break-all text-sm font-bold text-tf-marca-texto underline">
                {p.reuniao.link}
              </a>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold">
              <a className="text-tf-marca-texto" href={zap(`${primeiro}, lembrete da nossa reunião: ${quandoBR(p.reuniao.quando)}.${p.reuniao.link ? `\n${p.reuniao.link}` : ''}`)} target="_blank" rel="noreferrer">
                Avisar no WhatsApp
              </a>
              <button type="button" className="text-tf-suave" onClick={() => confirm('Desmarcar esta reunião?') && acao.rodar(() => removerReuniao(p.reuniao!.id), pronto('Reunião desmarcada'))}>
                Desmarcar
              </button>
            </div>
          </div>
        )}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            acao.rodar(() => salvarReuniao(m.id, reu), pronto('Reunião marcada'))
          }}
        >
          <p className="text-sm text-tf-suave">{p.reuniao ? 'Remarcar:' : 'Marque a data: vocês dois recebem lembrete 1 dia antes e 1 hora antes.'}</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="tf-campo" min={p.hoje} value={reu.data} onChange={(e) => setReu({ ...reu, data: e.target.value })} aria-label="Data da reunião" />
            <input type="time" className="tf-campo" value={reu.hora} onChange={(e) => setReu({ ...reu, hora: e.target.value })} aria-label="Hora da reunião" />
          </div>
          <input className="tf-campo" value={reu.link} onChange={(e) => setReu({ ...reu, link: e.target.value })} placeholder="Link (Meet, Zoom ou WhatsApp) — opcional" aria-label="Link da reunião" />
          <button type="submit" className="tf-botao2 w-full" disabled={acao.pendente || !reu.data || !reu.hora}>
            {p.reuniao ? 'Remarcar reunião' : 'Marcar reunião'}
          </button>
        </form>
      </section>
      <Erro texto={acao.erro} />

      {/* entregas */}
      {grupos.map(
        (g) =>
          g.itens.length > 0 && (
            <section key={g.titulo}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">
                  {g.titulo} <span className="text-tf-suave">({g.itens.length})</span>
                </h2>
                {g.titulo === 'Atrasadas' && (
                  <button
                    type="button"
                    className="shrink-0 text-sm font-bold text-tf-suave underline"
                    disabled={acao.pendente}
                    onClick={() =>
                      confirm(
                        `Excluir as ${g.itens.length} missões atrasadas de ${primeiro}?\n\nAs que se repetem recomeçam a contar de hoje. As de "uma vez" saem dele e continuam na biblioteca.`
                      ) &&
                      acao.rodar(
                        async () => {
                          const r = await excluirAtrasadas(m.id)
                          return r.ok ? { ok: true } : r
                        },
                        pronto('Atrasadas excluídas')
                      )
                    }
                  >
                    Excluir atrasadas
                  </button>
                )}
              </div>
              <ul className="space-y-3">
                {g.itens.map((e) => (
                  <li key={e.id} className={`tf-cartao p-4 ${g.destaque ? '!border-tf-marca' : e.situacao === 'atrasada' ? '!border-tf-texto' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold">
                          {e.destaque && <span className="mr-2 inline-flex items-center rounded-full bg-[#D4A017] px-2 py-0.5 align-middle text-[11px] font-extrabold text-[#1a1408]">⭐ PRIORIDADE</span>}
                          {e.titulo}
                        </p>
                        <p className="text-sm text-tf-suave">
                          {textoPrazo(e, p.hoje)}
                          {e.enviada_em && ` · entregue ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(e.enviada_em))}`}
                        </p>
                        {e.checklist.length > 0 && (
                          <p className="text-sm text-tf-suave">
                            checklist {e.checklist.filter((c) => c.f).length}/{e.checklist.length}
                            {e.checklist.some((c) => !c.f) && e.situacao === 'aguardando' && ` · faltou: ${e.checklist.filter((c) => !c.f).map((c) => c.t).join(', ')}`}
                          </p>
                        )}
                        {e.texto && <p className="mt-2 whitespace-pre-line rounded-xl bg-tf-fundo px-3 py-2 text-sm">{e.texto}</p>}
                        {e.motivo && e.situacao === 'devolvida' && <p className="mt-1 text-sm font-bold">Você devolveu: “{e.motivo}”</p>}
                      </div>
                      {e.foto_url && (
                        <button type="button" onClick={() => setFoto(e.foto_url)} className="shrink-0" aria-label="Ver foto">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={e.foto_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        </button>
                      )}
                    </div>
                    {e.situacao === 'aguardando' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" className="tf-botao min-h-[44px]" disabled={acao.pendente} onClick={() => acao.rodar(() => decidirEntrega(e.id, 'aprovar', ''), pronto('Aprovada'))}>
                          Aprovar
                        </button>
                        <button type="button" className="tf-botao2 min-h-[44px]" disabled={acao.pendente} onClick={() => (setMotivo(''), setDevolvendo(e))}>
                          Devolver
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
      )}
      {concluidas.length > 0 && (
        <section>
          <button type="button" className="mb-2 text-lg font-extrabold" onClick={() => setMostrarConcluidas((v) => !v)} aria-expanded={mostrarConcluidas}>
            Concluídas <span className="text-tf-suave">({concluidas.length})</span> {mostrarConcluidas ? '−' : '+'}
          </button>
          {mostrarConcluidas && (
            <ul className="tf-cartao divide-y divide-tf-borda">
              {concluidas.slice(0, 30).map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-tf-marca-texto" aria-hidden>
                    {e.situacao === 'fechada' ? '🔒' : '✓'}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {e.titulo}
                    {e.situacao === 'fechada' && <span className="text-tf-suave"> · barbearia fechada</span>}
                  </span>
                  <span className="shrink-0 text-xs text-tf-suave">{e.prazo.split('-').reverse().slice(0, 2).join('/')}</span>
                  {e.foto_url && (
                    <button type="button" className="shrink-0 text-xs font-bold text-tf-marca-texto" onClick={() => setFoto(e.foto_url)}>
                      foto
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* missões */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Missões de {primeiro}</h2>
          <div className="flex shrink-0 gap-2">
            {p.biblioteca.length > 0 && (
              <button type="button" className="tf-botao2 min-h-[44px] px-3 text-sm" disabled={!m.ativo} onClick={() => (setEscolhidas([]), setBib(true))}>
                📚 Da biblioteca
              </button>
            )}
            <button type="button" className="tf-botao min-h-[44px] px-4 text-sm" disabled={!m.ativo} onClick={() => setEditando('nova')}>
              + Missão
            </button>
          </div>
        </div>
        {p.missoes.length === 0 ? (
          <div className="tf-cartao px-5 py-8 text-center text-tf-suave">Nenhuma missão ainda. Crie a primeira: o que {primeiro} precisa fazer para ter resultado?</div>
        ) : (
          <ul className="tf-cartao divide-y divide-tf-borda">
            {[...p.missoes].sort((a, b) => Number(Boolean(b.destaque)) - Number(Boolean(a.destaque))).map((x) => (
              <li key={x.id} className={`px-4 py-3 ${x.ativo ? '' : 'opacity-50'}`}>
                <button type="button" className="block w-full text-left" onClick={() => setEditando(x)}>
                  <p className="font-bold">
                    {x.destaque && <span className="mr-2 inline-flex items-center rounded-full bg-[#D4A017] px-2 py-0.5 align-middle text-[11px] font-extrabold text-[#1a1408]">⭐ PRIORIDADE</span>}
                    {x.titulo}
                  </p>
                  <p className="text-sm text-tf-suave">
                    {regraMissao(x)}
                    {x.prova !== 'nenhuma' && ` · prova: ${x.prova === 'foto' ? 'foto' : 'texto'}`}
                    {x.aprovacao && ' · com aprovação'}
                    {(x.checklist?.length ?? 0) > 0 && ` · checklist de ${x.checklist!.length}`}
                    {x.para.length > 1 && ` · ${x.para.length} mentorados`}
                    {!x.ativo && ' · pausada'}
                  </p>
                </button>
                <div className="mt-1 flex gap-4 text-sm font-bold">
                  <button type="button" className="text-tf-marca-texto" onClick={() => acao.rodar(() => pausarMissao(x.id, !x.ativo), pronto(x.ativo ? 'Missão pausada' : 'Missão reativada'))}>
                    {x.ativo ? 'Pausar' : 'Reativar'}
                  </button>
                  <button
                    type="button"
                    className="text-tf-suave"
                    onClick={() =>
                      confirm(`Excluir “${x.titulo}”${x.para.length > 1 ? ` para os ${x.para.length} mentorados` : ''}? As entregas dela também somem.`) &&
                      acao.rodar(() => excluirMissao(x.id), pronto('Missão excluída'))
                    }
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editando && (
        <EditorMissao
          aberto
          hoje={p.hoje}
          mentorados={p.todos}
          missao={editando === 'nova' ? null : editando}
          paraPadrao={[m.id]}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null)
            pronto('Missão salva')()
          }}
        />
      )}

      <Modal aberto={bib} aoFechar={() => !acao.pendente && setBib(false)} titulo="Da biblioteca">
        <div className="space-y-4">
          <p className="text-tf-suave">Missões que você já criou e {primeiro} ainda não tem. Marque e vincule.</p>
          <ul className="divide-y divide-tf-borda rounded-2xl border border-tf-borda">
            {p.biblioteca.map((x) => {
              const sel = escolhidas.includes(x.id)
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    aria-pressed={sel}
                    onClick={() => setEscolhidas(sel ? escolhidas.filter((i) => i !== x.id) : [...escolhidas, x.id])}
                    className="flex w-full items-start gap-3 px-3 py-3 text-left"
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-black ${sel ? 'border-tf-marca bg-tf-marca text-white' : 'border-tf-borda text-transparent'}`} aria-hidden>
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold">{x.titulo}</span>
                      <span className="block text-sm text-tf-suave">{regraMissao(x)}</span>
                      {x.tipo === 'data' && x.data && x.data < p.hoje && (
                        <span className="block text-sm font-bold text-tf-texto">O prazo já passou: duplique na biblioteca e troque a data.</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Erro texto={acao.erro} />
          <button
            type="button"
            className="tf-botao w-full"
            disabled={acao.pendente || escolhidas.length === 0}
            onClick={() =>
              acao.rodar(() => vincularMissoes(m.id, escolhidas), () => {
                setBib(false)
                pronto(escolhidas.length > 1 ? `${escolhidas.length} missões vinculadas` : 'Missão vinculada')()
              })
            }
          >
            {escolhidas.length === 0 ? 'Marque as missões' : `Vincular ${escolhidas.length} a ${primeiro}`}
          </button>
        </div>
      </Modal>

      <Modal aberto={devolvendo !== null} aoFechar={() => setDevolvendo(null)} titulo="Devolver entrega">
        {devolvendo && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              acao.rodar(() => decidirEntrega(devolvendo.id, 'devolver', motivo), () => {
                setDevolvendo(null)
                pronto('Devolvida')()
              })
            }}
          >
            <p>
              <b>{devolvendo.titulo}</b> volta para {primeiro} refazer.
            </p>
            <div>
              <label className="tf-rotulo" htmlFor="dv-motivo">O que precisa ajustar (ele vai ver)</label>
              <input id="dv-motivo" className="tf-campo" autoFocus maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: o print não mostra o preço novo" />
            </div>
            <Erro texto={acao.erro} />
            <button type="submit" className="tf-botao w-full" disabled={acao.pendente || !motivo.trim()}>
              Devolver
            </button>
          </form>
        )}
      </Modal>

      <Modal aberto={dados} aoFechar={() => setDados(false)} titulo="Dados do mentorado">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            acao.rodar(() => editarMentorado(m.id, fd), () => {
              setDados(false)
              pronto('Salvo')()
            })
          }}
        >
          <div>
            <label className="tf-rotulo" htmlFor="dm-nome">Nome</label>
            <input id="dm-nome" className="tf-campo" value={fd.nome} onChange={(e) => setFd({ ...fd, nome: e.target.value })} />
          </div>
          <div>
            <label className="tf-rotulo" htmlFor="dm-zap">WhatsApp</label>
            <input id="dm-zap" className="tf-campo" inputMode="tel" value={fd.whatsapp} onChange={(e) => setFd({ ...fd, whatsapp: e.target.value })} />
          </div>
          <Interruptor rotulo="Mentorado ativo" descricao="Pausar: o link para de abrir e os lembretes param. Nada é apagado." ligado={fd.ativo} aoMudar={(v) => setFd({ ...fd, ativo: v })} />
          <Erro texto={acao.erro} />
          <button type="submit" className="tf-botao w-full" disabled={acao.pendente}>
            Salvar
          </button>
        </form>
      </Modal>

      <Modal aberto={foto !== null} aoFechar={() => setFoto(null)} titulo="Foto da entrega">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {foto && <img src={foto} alt="Foto da entrega" className="w-full rounded-2xl" />}
      </Modal>
      {aviso.elemento}
    </div>
  )
}
