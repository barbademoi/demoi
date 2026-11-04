'use client'

/**
 * PAINEL DE ACESSO DO ADMIN.
 *
 * Duas seções, porque são duas coisas diferentes:
 *
 *   1. LIBERAR PLUS — para uma conta que JÁ EXISTE. Busca por e-mail ou nome
 *      da barbearia, mostra o que ela tem HOJE módulo por módulo, e só então
 *      libera. É o caminho do mentorado: ele já usa o BarberMeta com conta
 *      própria e precisa dos módulos, não de uma conta nova.
 *   2. CONCEDER ACESSO (cortesia vitalícia) — cria conta nova de cortesia, ou
 *      marca uma existente como vitalícia. Dá LOGIN permanente e nada mais: o
 *      vitalício NÃO tem módulo Plus, porque a régua dos módulos pede
 *      assinatura e é cega pra ele.
 *
 * A prévia antes de confirmar não é enfeite. Conceder acesso na conta errada é
 * o erro mais caro desta tela, e a lista de módulos com a via de cada um ("por
 * compra avulsa", "por assinatura") é o que deixa isso visível antes do clique.
 */

import { useState, useTransition } from 'react'
import {
  concederAcesso, listarCortesias, buscarContas, detalharConta, concederPlus, revogarPlus,
  listarPlusManual,
  type Cortesia, type ResumoConta, type DetalheConta, type PlusManualAtivo,
} from './actions'
import { MODULOS_PLUS } from '@/lib/plus/modulos'

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(iso))
  } catch { return '—' }
}

const VIA_LABEL: Record<string, string> = {
  'assinatura': 'por assinatura ativa',
  'plus manual': 'por liberação manual',
  'compra avulsa': 'por compra avulsa',
  'licença': 'por licença da barbearia',
  'grandfather': 'por ser conta antiga',
}

function tipoLabel(c: ResumoConta): string {
  if (c.tipoAcesso === 'vitalicio') return 'vitalício'
  if (c.tipoAcesso === 'mensal') return `mensal (${c.statusAssinatura ?? 'sem status'})`
  if (c.tipoAcesso === 'anual') return `anual até ${formatarData(c.validoAte)}`
  return c.tipoAcesso ?? 'sem tipo'
}

export default function AdminCortesiasClient({
  cortesiasIniciais,
  plusIniciais,
}: {
  cortesiasIniciais: Cortesia[]
  plusIniciais: PlusManualAtivo[]
}) {
  // ── Seção 1: liberar Plus ──
  const [termo, setTermo] = useState('')
  const [resultados, setResultados] = useState<ResumoConta[] | null>(null)
  const [detalhe, setDetalhe] = useState<DetalheConta | null>(null)
  const [origem, setOrigem] = useState<'manual' | 'mentoria'>('mentoria')
  const [expiraEm, setExpiraEm] = useState('')
  const [confirmando, setConfirmando] = useState<'conceder' | 'revogar' | null>(null)
  const [erroPlus, setErroPlus] = useState<string | null>(null)
  const [avisoMigration, setAvisoMigration] = useState(false)
  const [sucessoPlus, setSucessoPlus] = useState<string | null>(null)
  const [plusAtivos, setPlusAtivos] = useState<PlusManualAtivo[]>(plusIniciais)
  const [buscando, buscar] = useTransition()
  const [aplicando, aplicar] = useTransition()

  // ── Seção 2: cortesia vitalícia ──
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<{ email: string; jaExistia: boolean } | null>(null)
  const [confirmarTroca, setConfirmarTroca] = useState<{ email: string; tipoAtual: string | null } | null>(null)
  const [cortesias, setCortesias] = useState<Cortesia[]>(cortesiasIniciais)
  const [isPending, startTransition] = useTransition()

  function handleBuscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErroPlus(null); setSucessoPlus(null); setDetalhe(null); setConfirmando(null)
    buscar(async () => {
      const r = await buscarContas(termo)
      if (r.error) { setErroPlus(r.error); setResultados([]); return }
      setAvisoMigration(!!r.faltaMigration)
      setResultados(r.contas)
    })
  }

  function abrirDetalhe(usuarioId: string) {
    setErroPlus(null); setSucessoPlus(null); setConfirmando(null)
    buscar(async () => {
      const r = await detalharConta(usuarioId)
      if (r.error || !r.detalhe) { setErroPlus(r.error ?? 'Conta não encontrada.'); return }
      setAvisoMigration(!!r.faltaMigration)
      setDetalhe(r.detalhe)
    })
  }

  function aplicarPlus(acao: 'conceder' | 'revogar') {
    if (!detalhe) return
    setErroPlus(null); setSucessoPlus(null)
    const fd = new FormData()
    fd.set('usuarioId', detalhe.conta.usuarioId)
    fd.set('origem', origem)
    if (acao === 'conceder' && expiraEm) fd.set('expiraEm', expiraEm)

    aplicar(async () => {
      const r = acao === 'conceder' ? await concederPlus(fd) : await revogarPlus(fd)
      if (r.error) { setErroPlus(r.error); return }
      setConfirmando(null)
      setSucessoPlus(
        acao === 'conceder'
          ? r.jaTinha
            ? `${r.detalhe?.email} já tinha o Plus — prazo e origem atualizados.`
            : `Plus liberado para ${r.detalhe?.email}.`
          : `Plus revogado de ${r.detalhe?.email}.`,
      )
      // Relê o estado do banco em vez de adivinhar o novo: é o mesmo caminho
      // que o dono vai ver depois, então um desacordo aqui apareceria agora.
      const novo = await detalharConta(detalhe.conta.usuarioId)
      if (novo.detalhe) setDetalhe(novo.detalhe)
      const lista = await listarPlusManual()
      setPlusAtivos(lista.contas)
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null); setSucesso(null); setConfirmarTroca(null)
    submeterCortesia(new FormData(e.currentTarget))
  }

  function submeterCortesia(formData: FormData) {
    startTransition(async () => {
      const result = await concederAcesso(formData)
      if (result?.error) { setErro(result.error); return }
      if (result?.precisaConfirmar) {
        setConfirmarTroca({
          email: result.detalhe?.email ?? email,
          tipoAtual: result.detalhe?.tipoAtual ?? null,
        })
        return
      }
      setSucesso({ email: result.detalhe?.email ?? email, jaExistia: !!result.jaExistia })
      setEmail('')
      const { cortesias: lista } = await listarCortesias()
      setCortesias(lista)
    })
  }

  return (
    <main className="bm-theme min-h-screen px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="mb-8">
          <h1 className="font-serif text-2xl text-text">Acesso e módulos</h1>
          <p className="text-text-muted text-sm font-sans mt-0.5">
            Liberar os módulos Plus de uma conta que já existe, ou conceder uma cortesia vitalícia.
          </p>
        </div>

        {avisoMigration && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-xs font-sans leading-relaxed">
            <p className="text-amber-400 font-semibold mb-1">Migration pendente</p>
            <p className="text-text-muted">
              As colunas do Plus manual ainda não existem no banco. Rode{' '}
              <span className="text-text">061_plus_manual.sql</span> no SQL Editor do Supabase pra
              liberar os módulos por aqui. O resto do painel funciona normalmente.
            </p>
          </div>
        )}

        {/* ── 1. LIBERAR PLUS ───────────────────────────────────────────── */}
        <section className="card p-6">
          <h2 className="font-sans font-semibold text-text text-sm">Liberar módulos Plus</h2>
          <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
            Libera {MODULOS_PLUS.map((m) => m.label).join(', ')} de uma vez. Não altera o tipo de
            acesso da conta e nenhum evento da Hotmart remove.
          </p>

          <form onSubmit={handleBuscar} className="mt-4 flex gap-2">
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="E-mail ou nome da barbearia"
              className="input flex-1"
              aria-label="Buscar conta por e-mail ou nome da barbearia"
            />
            <button type="submit" disabled={buscando} className="btn-secondary shrink-0">
              {buscando ? '…' : 'Buscar'}
            </button>
          </form>

          {erroPlus && <p className="text-red-400 text-sm font-sans mt-3">{erroPlus}</p>}
          {sucessoPlus && (
            <p className="text-green-400 text-sm font-sans mt-3">{sucessoPlus}</p>
          )}

          {resultados && resultados.length === 0 && !erroPlus && (
            <p className="text-text-muted text-xs font-sans mt-3">
              Nenhuma conta encontrada. Confira o e-mail DO LOGIN da pessoa — não o da compra.
            </p>
          )}

          {resultados && resultados.length > 0 && !detalhe && (
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
              {resultados.map((c) => (
                <li key={c.usuarioId}>
                  <button
                    type="button"
                    onClick={() => abrirDetalhe(c.usuarioId)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors"
                  >
                    <p className="text-text text-sm font-sans truncate">{c.email}</p>
                    <p className="text-text-muted text-[11px] font-sans mt-0.5">
                      {c.barbeariaNome} · {tipoLabel(c)}
                      {c.plusManualValendo && ' · Plus manual ativo'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {detalhe && (
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text text-sm font-sans font-semibold truncate">{detalhe.conta.email}</p>
                  <p className="text-text-muted text-[11px] font-sans">
                    {detalhe.conta.barbeariaNome} · acesso {tipoLabel(detalhe.conta)}
                    {detalhe.conta.origem && ` · origem ${detalhe.conta.origem}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDetalhe(null); setConfirmando(null) }}
                  className="text-text-muted text-xs font-sans shrink-0 underline"
                >
                  trocar conta
                </button>
              </div>

              {/* O que ela tem HOJE */}
              <div className="rounded-lg border border-border p-4">
                <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide mb-2">
                  O que ela tem hoje
                </p>
                <ul className="space-y-1.5">
                  {detalhe.modulos.map((m) => (
                    <li key={m.id} className="flex items-baseline gap-2 text-xs font-sans">
                      <span className={m.liberado ? 'text-green-400' : 'text-text-muted'}>
                        {m.liberado ? '✓' : '✕'}
                      </span>
                      <span className="text-text">{m.label}</span>
                      {m.via && (
                        <span className="text-text-muted">{VIA_LABEL[m.via] ?? m.via}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {detalhe.conta.plusManual && (
                  <p className="text-text-muted text-[11px] font-sans mt-3 leading-relaxed">
                    Plus manual concedido em {formatarData(detalhe.conta.plusManualEm)}
                    {detalhe.conta.plusManualOrigem && ` (${detalhe.conta.plusManualOrigem})`}
                    {detalhe.conta.plusManualAte
                      ? `, até ${formatarData(detalhe.conta.plusManualAte)}`
                      : ', sem prazo'}
                    {!detalhe.conta.plusManualValendo && ' — já vencido'}
                  </p>
                )}
              </div>

              {/* Conceder */}
              {confirmando !== 'revogar' && (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="origem" className="label">Origem</label>
                      <select
                        id="origem" className="input"
                        value={origem}
                        onChange={(e) => setOrigem(e.target.value as 'manual' | 'mentoria')}
                      >
                        <option value="mentoria">mentoria</option>
                        <option value="manual">manual</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="expiraEm" className="label">Validade (opcional)</label>
                      <input
                        id="expiraEm" type="date" className="input"
                        value={expiraEm}
                        onChange={(e) => setExpiraEm(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-text-muted text-[11px] font-sans leading-relaxed">
                    Sem data, o Plus não vence — só sai por revogação.
                  </p>

                  {confirmando === 'conceder' ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <p className="text-text text-xs font-sans leading-relaxed">
                        {detalhe.ganhaAoConceder.length > 0 ? (
                          <>
                            <span className="font-semibold">{detalhe.conta.email}</span> vai passar a
                            ter: {detalhe.ganhaAoConceder.join(', ')}.
                          </>
                        ) : (
                          <>Essa conta já tem todos os módulos por outra via. A liberação é registrada,
                            mas nada muda na prática.</>
                        )}
                      </p>
                      <p className="text-text-muted text-[11px] font-sans">
                        O tipo de acesso continua <span className="text-text">{tipoLabel(detalhe.conta)}</span>.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button type="button" disabled={aplicando}
                          onClick={() => aplicarPlus('conceder')} className="btn-primary flex-1">
                          {aplicando ? 'Liberando…' : 'Confirmar liberação'}
                        </button>
                        <button type="button" onClick={() => setConfirmando(null)}
                          className="btn-secondary shrink-0">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn-primary w-full"
                      onClick={() => setConfirmando('conceder')}>
                      {detalhe.conta.plusManualValendo ? 'Atualizar Plus' : 'Liberar Plus'}
                    </button>
                  )}
                </div>
              )}

              {/* Revogar */}
              {detalhe.conta.plusManual && confirmando !== 'conceder' && (
                confirmando === 'revogar' ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                    <p className="text-text text-xs font-sans leading-relaxed">
                      Revogar o Plus de <span className="font-semibold">{detalhe.conta.email}</span>.
                      {detalhe.perdeAoRevogar.length > 0
                        ? ` Ela perde: ${detalhe.perdeAoRevogar.join(', ')}.`
                        : ' Ela não perde módulo nenhum — tudo que usa vem por outra via.'}
                    </p>
                    <p className="text-text-muted text-[11px] font-sans leading-relaxed">
                      Não mexe no tipo de acesso, não mexe em compra paga pela Hotmart e não apaga
                      nenhum dado da conta.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button type="button" disabled={aplicando}
                        onClick={() => aplicarPlus('revogar')}
                        className="btn-primary flex-1">
                        {aplicando ? 'Revogando…' : 'Confirmar revogação'}
                      </button>
                      <button type="button" onClick={() => setConfirmando(null)}
                        className="btn-secondary shrink-0">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="btn-secondary w-full"
                    onClick={() => setConfirmando('revogar')}>
                    Revogar Plus
                  </button>
                )
              )}
            </div>
          )}
        </section>

        {/* Quem está com Plus manual */}
        {plusAtivos.length > 0 && (
          <div className="mt-6">
            <h2 className="font-sans font-semibold text-text text-sm mb-3">
              Plus manual ativo <span className="text-text-muted">({plusAtivos.length})</span>
            </h2>
            <ul className="card divide-y divide-border">
              {plusAtivos.map((p) => (
                <li key={p.usuarioId} className="px-4 py-3">
                  <button type="button" onClick={() => abrirDetalhe(p.usuarioId)}
                    className="w-full text-left">
                    <p className="text-text text-sm font-sans truncate">{p.email}</p>
                    <p className="text-text-muted text-[11px] font-sans mt-0.5">
                      {p.origem ?? 'manual'} · desde {formatarData(p.concedidoEm)} ·{' '}
                      {p.expiraEm ? `até ${formatarData(p.expiraEm)}` : 'sem prazo'}
                      {!p.valendo && ' · vencido'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 2. CORTESIA VITALÍCIA ─────────────────────────────────────── */}
        <section className="card p-6 mt-8">
          <h2 className="font-sans font-semibold text-text text-sm">Conceder acesso (cortesia vitalícia)</h2>
          <p className="text-text-muted text-xs font-sans mt-1 leading-relaxed">
            Acesso permanente ao sistema, fora da régua de assinatura. Não inclui os módulos Plus —
            pra eles, use a seção acima.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <label htmlFor="email" className="label">E-mail da pessoa *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pessoa@email.com"
                className="input"
              />
            </div>

            {erro && <p className="text-red-400 text-sm font-sans text-center">{erro}</p>}

            {confirmarTroca && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-xs font-sans leading-relaxed space-y-2">
                <p className="text-amber-400 font-semibold">Essa conta é pagante</p>
                <p className="text-text-muted">
                  <span className="text-text">{confirmarTroca.email}</span> tem acesso{' '}
                  <span className="text-text">{confirmarTroca.tipoAtual ?? '—'}</span>. Marcar como
                  cortesia vitalícia tira a conta da régua de assinatura — ela passa a ter o sistema
                  de graça pra sempre. Se o que você quer é só liberar os módulos, use{' '}
                  <span className="text-text">Liberar módulos Plus</span> lá em cima.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isPending}
                    className="btn-primary flex-1"
                    onClick={() => {
                      const fd = new FormData()
                      fd.set('email', confirmarTroca.email)
                      fd.set('confirmarTroca', 'sim')
                      setConfirmarTroca(null)
                      submeterCortesia(fd)
                    }}
                  >
                    Tornar vitalícia mesmo assim
                  </button>
                  <button type="button" className="btn-secondary shrink-0"
                    onClick={() => setConfirmarTroca(null)}>Cancelar</button>
                </div>
              </div>
            )}

            {sucesso && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm font-sans">
                <p className="text-green-400 font-semibold mb-1">
                  {sucesso.jaExistia ? 'Conta já existia — cortesia garantida ✅' : 'Acesso de cortesia concedido ✅'}
                </p>
                <p className="text-text-muted text-xs leading-relaxed">
                  <span className="text-text">{sucesso.email}</span> agora tem acesso vitalício de cortesia.
                  {' '}Peça pra pessoa entrar em <span className="text-text">“Esqueci minha senha”</span> com esse
                  e-mail pra definir a senha dela e acessar.
                </p>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Concedendo…' : 'Conceder acesso'}
            </button>
          </form>
        </section>

        {/* Cortesias já concedidas */}
        <div className="mt-8">
          <h2 className="font-sans font-semibold text-text text-sm mb-3">
            Cortesias concedidas {cortesias.length > 0 && <span className="text-text-muted">({cortesias.length})</span>}
          </h2>
          {cortesias.length === 0 ? (
            <p className="text-text-muted text-xs font-sans">Nenhuma cortesia concedida ainda.</p>
          ) : (
            <ul className="card divide-y divide-border">
              {cortesias.map((c) => (
                <li key={c.email} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-sans">
                  <span className="text-text truncate">{c.email}</span>
                  <span className="text-text-muted text-xs shrink-0">{formatarData(c.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-muted text-[11px] font-sans mt-3 leading-relaxed">
            Pra revogar uma cortesia depois, é feito manualmente no Supabase (Auth → remover o usuário
            ou desvincular a conta). O Plus manual, esse sim, se revoga aqui mesmo.
          </p>
        </div>

      </div>
    </main>
  )
}
