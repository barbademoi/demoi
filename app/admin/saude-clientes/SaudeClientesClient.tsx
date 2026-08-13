'use client'

import { useEffect, useMemo, useState } from 'react'
import { motivosDaSaude } from './criterios'
import type { ClienteSaude, StatusSaude } from './types'

type FiltroStatus = StatusSaude | 'todos'
type Ordenacao = 'diasLogin' | 'diasLancamento' | 'cadastro' | 'nome'

const STATUS: Record<StatusSaude, {
  label: string
  dot: string
  badge: string
  card: string
}> = {
  saudavel: {
    label: 'Saudável',
    dot: 'bg-emerald-400',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    card: 'border-emerald-400/25 bg-emerald-400/[0.08]',
  },
  atencao: {
    label: 'Atenção',
    dot: 'bg-amber-300',
    badge: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
    card: 'border-amber-300/25 bg-amber-300/[0.08]',
  },
  risco: {
    label: 'Em risco',
    dot: 'bg-red-400',
    badge: 'border-red-400/30 bg-red-400/10 text-red-200',
    card: 'border-red-400/25 bg-red-400/[0.08]',
  },
}

function dataCurta(value: string | null, incluirHora = false) {
  if (!value) return 'Nunca'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00-03:00`)
    : new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(incluirHora ? { timeStyle: 'short' as const } : {}),
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function diasLabel(dias: number) {
  if (dias === 0) return 'Hoje'
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

function whatsappLink(telefone: string | null) {
  if (!telefone) return null
  let digits = telefone.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  if (digits.length < 12 || digits.length > 13) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent('Olá! Tudo bem? Aqui é o Carlos, do BarberMeta. Quero saber como está sua experiência com o sistema e se posso ajudar em algo.')}`
}

function StatusBadge({ status }: { status: StatusSaude }) {
  const item = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${item.badge}`}>
      <span className={`h-2 w-2 rounded-full ${item.dot}`} aria-hidden />
      {item.label}
    </span>
  )
}

function ResumoCard({
  label,
  valor,
  status,
  ativo,
  onClick,
}: {
  label: string
  valor: number
  status?: StatusSaude
  ativo: boolean
  onClick: () => void
}) {
  const color = status ? STATUS[status] : null
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition sm:p-5 ${
        color ? color.card : 'border-border bg-surface'
      } ${ativo ? 'ring-2 ring-primary/70' : 'hover:-translate-y-0.5 hover:border-primary/30'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-3xl tabular-nums text-text sm:text-4xl">{valor}</p>
        {color && <span className={`h-3 w-3 rounded-full ${color.dot}`} aria-hidden />}
      </div>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.13em] text-text-muted">{label}</p>
    </button>
  )
}

export default function SaudeClientesClient({ rows }: { rows: ClienteSaude[] }) {
  const [status, setStatus] = useState<FiltroStatus>('todos')
  const [busca, setBusca] = useState('')
  const [minDiasLogin, setMinDiasLogin] = useState('')
  const [minDiasLancamento, setMinDiasLancamento] = useState('')
  const [nuncaLancou, setNuncaLancou] = useState(false)
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('diasLogin')
  const [pagina, setPagina] = useState(1)
  const [selecionado, setSelecionado] = useState<ClienteSaude | null>(null)

  const contagem = useMemo(() => ({
    todos: rows.length,
    saudavel: rows.filter((row) => row.statusSaude === 'saudavel').length,
    atencao: rows.filter((row) => row.statusSaude === 'atencao').length,
    risco: rows.filter((row) => row.statusSaude === 'risco').length,
  }), [rows])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    const loginMin = minDiasLogin === '' ? null : Math.max(0, Number(minDiasLogin))
    const lancamentoMin = minDiasLancamento === '' ? null : Math.max(0, Number(minDiasLancamento))

    const resultado = rows.filter((row) => {
      if (status !== 'todos' && row.statusSaude !== status) return false
      if (termo) {
        const texto = `${row.nome} ${row.cidade ?? ''} ${row.emailDono ?? ''}`.toLocaleLowerCase('pt-BR')
        if (!texto.includes(termo)) return false
      }
      if (loginMin !== null && row.diasSemLogin < loginMin) return false
      if (lancamentoMin !== null && row.diasSemLancamento < lancamentoMin) return false
      if (nuncaLancou && !row.nuncaLancou) return false
      return true
    })

    return resultado.sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')
      if (ordenacao === 'cadastro') return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime()
      if (ordenacao === 'diasLancamento') return b.diasSemLancamento - a.diasSemLancamento
      return b.diasSemLogin - a.diasSemLogin
    })
  }, [rows, status, busca, minDiasLogin, minDiasLancamento, nuncaLancou, ordenacao])

  const porPagina = 50
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const visiveis = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina)

  useEffect(() => setPagina(1), [status, busca, minDiasLogin, minDiasLancamento, nuncaLancou, ordenacao])
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas)
  }, [pagina, totalPaginas])

  const limpar = () => {
    setStatus('todos')
    setBusca('')
    setMinDiasLogin('')
    setMinDiasLancamento('')
    setNuncaLancou(false)
    setOrdenacao('diasLogin')
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo da saúde dos clientes">
        <ResumoCard label="Total de clientes" valor={contagem.todos} ativo={status === 'todos'} onClick={() => setStatus('todos')} />
        <ResumoCard label="Clientes saudáveis" valor={contagem.saudavel} status="saudavel" ativo={status === 'saudavel'} onClick={() => setStatus(status === 'saudavel' ? 'todos' : 'saudavel')} />
        <ResumoCard label="Clientes em atenção" valor={contagem.atencao} status="atencao" ativo={status === 'atencao'} onClick={() => setStatus(status === 'atencao' ? 'todos' : 'atencao')} />
        <ResumoCard label="Clientes em risco" valor={contagem.risco} status="risco" ativo={status === 'risco'} onClick={() => setStatus(status === 'risco' ? 'todos' : 'risco')} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Filtros e ordenação">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'saudavel', 'atencao', 'risco'] as FiltroStatus[]).map((item) => {
            const ativo = status === item
            const label = item === 'todos' ? 'Todos' : STATUS[item].label
            return (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${ativo ? 'border-primary bg-primary/15 text-text' : 'border-border text-text-muted hover:text-text'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(165px,0.7fr)_minmax(165px,0.7fr)_minmax(210px,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Buscar</span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome, cidade ou e-mail"
              className="input w-full"
              style={{ fontSize: 16 }}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Sem login há</span>
            <div className="relative">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={minDiasLogin}
                onChange={(event) => setMinDiasLogin(event.target.value)}
                placeholder="X dias"
                className="input w-full pr-12"
                style={{ fontSize: 16 }}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Sem lançamento há</span>
            <div className="relative">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={minDiasLancamento}
                onChange={(event) => setMinDiasLancamento(event.target.value)}
                placeholder="X dias"
                className="input w-full pr-12"
                style={{ fontSize: 16 }}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Ordenar por</span>
            <select value={ordenacao} onChange={(event) => setOrdenacao(event.target.value as Ordenacao)} className="input w-full" style={{ fontSize: 16 }}>
              <option value="diasLogin">Dias sem login</option>
              <option value="diasLancamento">Dias sem lançamento</option>
              <option value="cadastro">Data de cadastro</option>
              <option value="nome">Nome</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
            <input type="checkbox" checked={nuncaLancou} onChange={(event) => setNuncaLancou(event.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            Nunca lançou faturamento
          </label>
          <button type="button" onClick={limpar} className="text-xs font-semibold text-text-muted underline underline-offset-4 transition hover:text-text">
            Limpar filtros
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-text-muted">
        <span>{filtrados.length} {filtrados.length === 1 ? 'barbearia encontrada' : 'barbearias encontradas'}</span>
        <span>Atividade da equipe = lançamento pelo link do barbeiro no mês</span>
      </div>

      <section className="hidden overflow-hidden rounded-2xl border border-border bg-surface lg:block" aria-label="Clientes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] border-collapse text-left text-xs">
            <thead className="bg-surface-2 text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">
              <tr>
                <th className="sticky left-0 z-10 bg-surface-2 px-4 py-3">Barbearia</th>
                <th className="px-3 py-3">Cidade</th>
                <th className="px-3 py-3">Plano</th>
                <th className="px-3 py-3">Cadastro</th>
                <th className="px-3 py-3">Último login</th>
                <th className="px-3 py-3">Sem acessar</th>
                <th className="px-3 py-3">Último lançamento</th>
                <th className="px-3 py-3">Sem lançar</th>
                <th className="px-3 py-3 text-center">Barbeiros</th>
                <th className="px-3 py-3 text-center">Ativos no mês</th>
                <th className="px-3 py-3">Saúde</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visiveis.map((row) => {
                const whats = whatsappLink(row.telefone)
                return (
                  <tr key={row.barbeariaId} className="transition hover:bg-surface-2/60">
                    <td className="sticky left-0 z-[1] max-w-[220px] bg-surface px-4 py-3 group-hover:bg-surface-2">
                      <p className="truncate font-semibold text-text" title={row.nome}>{row.nome}</p>
                      <p className="mt-0.5 truncate text-[11px] text-text-muted" title={row.emailDono ?? ''}>{row.emailDono ?? 'Sem e-mail'}</p>
                    </td>
                    <td className="max-w-[150px] px-3 py-3 text-text-muted"><span className="block truncate" title={row.cidade ?? ''}>{row.cidade ?? '—'}</span></td>
                    <td className="px-3 py-3"><span className="whitespace-nowrap rounded-full border border-border px-2 py-1 text-[11px] text-text-muted">{row.plano}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-text-muted">{dataCurta(row.dataCadastro)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-text-muted">{dataCurta(row.ultimoLogin, true)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-text">{diasLabel(row.diasSemLogin)}{row.nuncaLogou && <span className="ml-1 text-[10px] text-text-muted">· nunca entrou</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-text-muted">{dataCurta(row.ultimoLancamentoDiario)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-text">{diasLabel(row.diasSemLancamento)}{row.nuncaLancou && <span className="ml-1 text-[10px] text-text-muted">· nunca lançou</span>}</td>
                    <td className="px-3 py-3 text-center font-semibold tabular-nums text-text">{row.quantidadeBarbeiros}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold tabular-nums text-text">{row.barbeirosComAtividadeMes}</span>
                      <span className="text-text-muted">/{row.quantidadeBarbeiros}</span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={row.statusSaude} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSelecionado(row)} className="whitespace-nowrap rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-text transition hover:border-primary/50 hover:bg-primary/10">
                          Visualizar painel
                        </button>
                        {whats ? (
                          <a href={whats} target="_blank" rel="noreferrer" className="whitespace-nowrap rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-2.5 py-2 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-400/15">
                            WhatsApp
                          </a>
                        ) : (
                          <span className="cursor-not-allowed whitespace-nowrap rounded-lg border border-border px-2.5 py-2 text-[11px] text-text-muted/50" title="Telefone não cadastrado">Sem telefone</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {visiveis.length === 0 && <p className="p-8 text-center text-sm text-text-muted">Nenhuma barbearia encontrada com estes filtros.</p>}
      </section>

      <section className="space-y-3 lg:hidden" aria-label="Clientes">
        {visiveis.map((row) => {
          const whats = whatsappLink(row.telefone)
          return (
            <article key={row.barbeariaId} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-text">{row.nome}</h2>
                  <p className="mt-1 truncate text-xs text-text-muted">{row.cidade ?? 'Cidade não informada'} · {row.plano}</p>
                </div>
                <StatusBadge status={row.statusSaude} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-text-muted">Sem acessar</dt><dd className="mt-1 font-semibold text-text">{diasLabel(row.diasSemLogin)}{row.nuncaLogou ? ' · nunca entrou' : ''}</dd></div>
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-text-muted">Sem lançar</dt><dd className="mt-1 font-semibold text-text">{diasLabel(row.diasSemLancamento)}{row.nuncaLancou ? ' · nunca lançou' : ''}</dd></div>
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-text-muted">Último login</dt><dd className="mt-1 font-semibold text-text">{dataCurta(row.ultimoLogin, true)}</dd></div>
                <div className="rounded-xl bg-surface-2 p-3"><dt className="text-text-muted">Barbeiros ativos</dt><dd className="mt-1 font-semibold text-text">{row.barbeirosComAtividadeMes}/{row.quantidadeBarbeiros} no mês</dd></div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSelecionado(row)} className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-text">Visualizar painel</button>
                {whats ? <a href={whats} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-2.5 text-center text-xs font-semibold text-emerald-200">Abrir WhatsApp</a> : <span className="rounded-xl border border-border px-3 py-2.5 text-center text-xs text-text-muted/50">Sem telefone</span>}
              </div>
            </article>
          )
        })}
        {visiveis.length === 0 && <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted">Nenhuma barbearia encontrada com estes filtros.</p>}
      </section>

      {totalPaginas > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginação">
          <button type="button" disabled={pagina === 1} onClick={() => setPagina((atual) => Math.max(1, atual - 1))} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
          <span className="text-xs text-text-muted">Página {pagina} de {totalPaginas}</span>
          <button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))} className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
        </nav>
      )}

      {selecionado && <PainelBarbearia cliente={selecionado} onClose={() => setSelecionado(null)} />}
    </div>
  )
}

function PainelBarbearia({ cliente, onClose }: { cliente: ClienteSaude; onClose: () => void }) {
  const whats = whatsappLink(cliente.telefone)
  const motivos = motivosDaSaude(cliente)

  useEffect(() => {
    const fechar = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', fechar)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', fechar)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="painel-cliente-titulo" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Painel da barbearia</p>
            <h2 id="painel-cliente-titulo" className="mt-1 truncate font-serif text-2xl text-text sm:text-3xl">{cliente.nome}</h2>
            <p className="mt-1 text-sm text-text-muted">{cliente.cidade ?? 'Cidade não informada'} · {cliente.plano}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-xl text-text-muted transition hover:text-text" aria-label="Fechar">×</button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge status={cliente.statusSaude} />
          <span className="text-xs text-text-muted">Cadastro em {dataCurta(cliente.dataCadastro)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Dias sem login" value={String(cliente.diasSemLogin)} />
          <Metric label="Dias sem lançar" value={String(cliente.diasSemLancamento)} />
          <Metric label="Barbeiros ativos" value={`${cliente.barbeirosComAtividadeMes}/${cliente.quantidadeBarbeiros}`} />
          <Metric label="Dias ativos em 30" value={String(cliente.diasComAtividade30)} />
        </div>

        <section className="mt-5 rounded-2xl border border-border bg-surface-2 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-text-muted">Leitura da saúde</h3>
          <ul className="mt-3 space-y-2 text-sm text-text">
            {motivos.map((motivo) => <li key={motivo} className="flex gap-2"><span className="text-primary">•</span><span>{motivo}</span></li>)}
          </ul>
        </section>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <Detalhe label="E-mail do responsável" value={cliente.emailDono ?? 'Não informado'} />
          <Detalhe label="Telefone" value={cliente.telefone ?? 'Não informado'} />
          <Detalhe label="Último login" value={dataCurta(cliente.ultimoLogin, true)} />
          <Detalhe label="Último lançamento diário" value={dataCurta(cliente.ultimoLancamentoDiario)} />
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text">Fechar</button>
          {whats && <a href={whats} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-emerald-400">Conversar pelo WhatsApp</a>}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-surface-2 p-4"><p className="font-serif text-2xl tabular-nums text-text">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.11em] text-text-muted">{label}</p></div>
}

function Detalhe({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border p-3"><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-1 break-words font-semibold text-text">{value}</dd></div>
}
