'use client'

// Modulo Financeiro do BarberMeta.
// Estado salvo no Supabase via lib/financeiro/supabaseStore (substitui o
// armazenamento local window.storage original). A area de backup/exportar
// foi removida — o Supabase ja sincroniza entre aparelhos automaticamente.

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  loadState as remoteLoad,
  saveState as remoteSave,
} from '@/lib/financeiro/supabaseStore'
import { buscarComissoesBarbermeta } from '@/lib/financeiro/serverActions'

// ---- Design tokens (alinhados com BarberMeta) ----------------------------
const C = {
  bg: '#08090D',           // BM background
  surface: '#0F1117',      // BM surface
  surface2: '#161820',     // BM surface-2
  ink: '#EEF0F6',          // BM text
  inkSoft: '#C4CDD4',
  faint: '#8B96A0',
  line: '#1E2028',         // BM border
  primary: '#D2AE62',      // brass/gold (mantido — combina com financeiro)
  primaryInk: '#0F1117',   // texto sobre o primary
  primarySoft: 'rgba(210,174,98,0.18)',
  in: '#4ADE80',           // entradas (verde)
  out: '#F87171',          // saidas (vermelho)
}

const FONT_BODY = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
const FONT_NUM = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const brl = (n: any) =>
  (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const pad = (n: number) => String(n).padStart(2, '0')

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function currentMonth() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }
function addMonths(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const idx = y * 12 + (m - 1) + delta
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`
}
function monthDiff(a: string, b: string) {
  const [ya, ma] = a.split('-').map(Number)
  const [yb, mb] = b.split('-').map(Number)
  return (ya * 12 + ma) - (yb * 12 + mb)
}
function monthLabel(ym: string) { const [y, m] = ym.split('-').map(Number); return `${MESES[m - 1]} ${y}` }
function appearsIn(b: any, ym: string) {
  if (b.recurrence === 'fixed') return ym >= b.startMonth
  if (b.recurrence === 'installments') { const d = monthDiff(ym, b.startMonth); return d >= 0 && d < (b.installments || 1) }
  return b.startMonth === ym
}
const isDone = (b: any, ym: string) => !!(b.done && b.done[ym])
const collabValue = (c: any, ym: string) => (c.type === 'comissao' ? Number(c.monthly && c.monthly[ym]) || 0 : Number(c.amount) || 0)

const EMPTY: any = { accounts: [], payables: [], receivables: [], collaborators: [], openings: {}, seenGuide: false }

// ---- Storage (agora via Supabase) ---------------------------------------
async function loadState() {
  return migrate({ ...EMPTY, ...(await remoteLoad() || {}) })
}
async function saveState(state: any) {
  await remoteSave(state)
}

function migrateBill(i: any, anchor: string) {
  const startMonth = i.startMonth || (i.dueDate ? i.dueDate.slice(0, 7) : anchor)
  const done = { ...(i.done || {}) }
  if (i.paid || i.received) done[startMonth] = true
  return { recurrence: 'once', installments: 1, ...i, scope: i.scope || 'empresa', startMonth, done }
}
function migrate(s: any) {
  const anchor = currentMonth()
  const base = (arr: any[]) => (arr || []).map((i: any) => ({ ...i, scope: i.scope || 'empresa' }))
  return {
    accounts: base(s.accounts),
    collaborators: (s.collaborators || []).map((c: any) => {
      const m: any = { ...c, scope: 'empresa' }
      if (m.type === 'comissao' && !m.monthly) m.monthly = m.amount ? { [currentMonth()]: m.amount } : {}
      return m
    }),
    payables: (s.payables || []).map((i: any) => migrateBill(i, anchor)),
    receivables: (s.receivables || []).map((i: any) => migrateBill(i, anchor)),
    openings: s.openings || {},
    seenGuide: s.seenGuide || false,
  }
}

// ---- UI primitives -------------------------------------------------------
function Field({ label, children, grow = '1 1 140px' }: any) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: grow }}>
      <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
      {children}
    </label>
  )
}
const inputStyle: React.CSSProperties = {
  fontFamily: FONT_BODY, fontSize: 15, color: C.ink, background: C.surface2,
  border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 12px',
  outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark',
}
function Btn({ children, onClick, tone = 'primary', small, type = 'button' as 'button' }: any) {
  const tones: any = {
    primary: { bg: C.primary, fg: C.primaryInk, bd: C.primary },
    ghost: { bg: 'transparent', fg: C.inkSoft, bd: C.line },
    danger: { bg: 'transparent', fg: C.out, bd: 'transparent' },
  }
  const t = tones[tone]
  return (
    <button type={type} onClick={onClick}
      style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: small ? 13 : 15, color: t.fg, background: t.bg,
        border: `1px solid ${t.bd}`, borderRadius: 10, padding: small ? '7px 12px' : '11px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      onMouseDown={(e: any) => (e.currentTarget.style.filter = 'brightness(.92)')}
      onMouseUp={(e: any) => (e.currentTarget.style.filter = 'none')}
      onMouseLeave={(e: any) => (e.currentTarget.style.filter = 'none')}>
      {children}
    </button>
  )
}
function Card({ children, style }: any) {
  return <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>
}
function Empty({ children }: any) {
  return <div style={{ textAlign: 'center', padding: '32px 16px', color: C.faint, fontSize: 14, border: `1px dashed ${C.line}`, borderRadius: 12 }}>{children}</div>
}
function Num({ value, color = C.ink, size = 15, weight = 600 }: any) {
  return <span style={{ fontFamily: FONT_NUM, fontSize: size, color, fontWeight: weight, fontVariantNumeric: 'tabular-nums' }}>{brl(value)}</span>
}
function Badge({ children, color }: any) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color, border: `1px solid ${color}`, padding: '2px 7px', borderRadius: 6, display: 'inline-block' }}>{children}</span>
}
const rowStyle = (accent: string, muted?: boolean): React.CSSProperties => ({
  background: C.surface, border: `1px solid ${C.line}`, borderLeft: `3px solid ${muted ? C.line : accent}`,
  borderRadius: 12, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
})
const linkStyle: React.CSSProperties = { color: C.primary, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }

function MonthNav({ month, setMonth }: any) {
  const now = currentMonth()
  const arrow = (label: string, onClick: () => void) => (
    <button onClick={onClick} aria-label={label} style={{ fontFamily: FONT_BODY, fontSize: 20, lineHeight: 1, color: C.ink, background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 9, width: 38, height: 38, cursor: 'pointer' }}>
      {label}
    </button>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
      {arrow('‹', () => setMonth(addMonths(month, -1)))}
      <div style={{ textAlign: 'center', minWidth: 168 }}>
        <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink }}>{monthLabel(month)}</div>
        {month !== now && (
          <button onClick={() => setMonth(now)} style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0' }}>
            voltar para {monthLabel(now)}
          </button>
        )}
      </div>
      {arrow('›', () => setMonth(addMonths(month, 1)))}
    </div>
  )
}

// ---- App -----------------------------------------------------------------
export default function ControleFinanceiro() {
  const [state, setState] = useState<any>(EMPTY)
  const [tab, setTab] = useState('overview')
  const [scope, setScope] = useState('empresa')
  const [month, setMonth] = useState(currentMonth())
  const [ready, setReady] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    const id = 'fin-fonts'
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
      const l = document.createElement('link')
      l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'
      document.head.appendChild(l)
    }
  }, [])
  useEffect(() => { loadState().then((s: any) => { setState(s); setReady(true) }) }, [])
  useEffect(() => {
    if (!ready) return
    if (first.current) { first.current = false; return }
    saveState(state)
  }, [state, ready])

  // Auto-sync das comissoes do BarberMeta:
  // Apos carregar o state, busca a comissao acumulada do ciclo atual e
  // atualiza monthly[mesAno] dos colaboradores tipo 'comissao' que ja
  // existem (matching por nome, case-insensitive). NAO cria novos — quem
  // ainda nao foi importado nem aparece (botao "Importar agora" faz isso).
  // Colaboradores tipo 'salario' ou de scope 'pessoal' ficam intocados.
  const synced = useRef(false)
  useEffect(() => {
    if (!ready || synced.current) return
    synced.current = true
    const temComissao = state.collaborators.some(
      (c: any) => c.scope === 'empresa' && c.type === 'comissao',
    )
    if (!temComissao) return
    buscarComissoesBarbermeta().then((res) => {
      if ('error' in res) return
      const { mesAno, barbeiros } = res
      const norm = (s: string) => s.trim().toLowerCase()
      const mapa = new Map(barbeiros.map((b) => [norm(b.nome), b.comissao]))
      setState((s: any) => ({
        ...s,
        collaborators: s.collaborators.map((c: any) => {
          if (c.scope !== 'empresa' || c.type !== 'comissao') return c
          const v = mapa.get(norm(c.name))
          if (v === undefined) return c
          if ((c.monthly?.[mesAno] ?? null) === v) return c
          return { ...c, monthly: { ...(c.monthly || {}), [mesAno]: v } }
        }),
      }))
    }).catch(() => { /* sync silencioso, ignora erros */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const update = (patch: any) => setState((s: any) => ({ ...s, ...patch }))

  const [showGuide, setShowGuide] = useState(false)
  const isEmpty = state.accounts.length === 0 && state.payables.length === 0 && state.receivables.length === 0 && state.collaborators.length === 0
  useEffect(() => {
    if (ready && isEmpty && !state.seenGuide) setShowGuide(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])
  const closeGuide = () => { setShowGuide(false); if (!state.seenGuide) update({ seenGuide: true }) }

  const accountsSum = (sf: string) => state.accounts.filter((a: any) => a.scope === sf).reduce((a: number, x: any) => a + (Number(x.balance) || 0), 0)
  const computeScope = (sf: string) => {
    const f = (arr: any[]) => arr.filter((i: any) => i.scope === sf)
    const caixa = accountsSum(sf)
    const aPagar = f(state.payables).filter((p: any) => appearsIn(p, month) && !isDone(p, month)).reduce((a: number, x: any) => a + (Number(x.amount) || 0), 0)
    const aReceber = f(state.receivables).filter((r: any) => appearsIn(r, month) && !isDone(r, month)).reduce((a: number, x: any) => a + (Number(x.amount) || 0), 0)
    const pago = f(state.payables).filter((p: any) => appearsIn(p, month) && isDone(p, month)).reduce((a: number, x: any) => a + (Number(x.amount) || 0), 0)
    const recebido = f(state.receivables).filter((r: any) => appearsIn(r, month) && isDone(r, month)).reduce((a: number, x: any) => a + (Number(x.amount) || 0), 0)
    const folha = f(state.collaborators).reduce((a: number, c: any) => a + collabValue(c, month), 0)
    const sobra = caixa + aReceber - aPagar - folha
    return { caixa, aPagar, aReceber, pago, recebido, folha, sobra }
  }
  const empresaT = computeScope('empresa')
  const pessoalT = computeScope('pessoal')
  const scoped = scope === 'empresa' ? empresaT : pessoalT
  const combined = {
    caixa: empresaT.caixa + pessoalT.caixa,
    aPagar: empresaT.aPagar + pessoalT.aPagar,
    aReceber: empresaT.aReceber + pessoalT.aReceber,
    pago: empresaT.pago + pessoalT.pago,
    recebido: empresaT.recebido + pessoalT.recebido,
    folha: empresaT.folha + pessoalT.folha,
    sobra: empresaT.sobra + pessoalT.sobra,
  }
  const caixa = scoped.caixa
  const folha = scoped.folha

  const adjustAccount = (accounts: any[], accId: string | null, delta: number) =>
    accId ? accounts.map((a: any) => (a.id === accId ? { ...a, balance: (Number(a.balance) || 0) + delta } : a)) : accounts
  const settleBill = (listKey: string, sign: number) => (id: string, ym: string, accId: string | null) => {
    const list = state[listKey]
    const bill = list.find((b: any) => b.id === id)
    if (!bill) return
    const amt = Number(bill.amount) || 0
    update({
      [listKey]: list.map((b: any) => (b.id === id ? { ...b, done: { ...(b.done || {}), [ym]: accId ? { account: accId } : true } } : b)),
      accounts: adjustAccount(state.accounts, accId, sign * amt),
    })
  }
  const unsettleBill = (listKey: string, sign: number) => (id: string, ym: string) => {
    const list = state[listKey]
    const bill = list.find((b: any) => b.id === id)
    if (!bill) return
    const prev = bill.done && bill.done[ym]
    const accId = prev && typeof prev === 'object' ? prev.account : null
    const amt = Number(bill.amount) || 0
    const nextDone = { ...(bill.done || {}) }
    delete nextDone[ym]
    update({
      [listKey]: list.map((b: any) => (b.id === id ? { ...b, done: nextDone } : b)),
      accounts: adjustAccount(state.accounts, accId, -sign * amt),
    })
  }
  const tabs = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'payables', label: 'A pagar' },
    { id: 'receivables', label: 'A receber' },
    { id: 'collaborators', label: 'Colaboradores' },
    { id: 'accounts', label: 'Caixa' },
  ].filter((t) => !(t.id === 'collaborators' && scope === 'pessoal'))
  const showMonth = ['overview', 'payables', 'receivables', 'collaborators'].includes(tab)

  useEffect(() => {
    if (scope === 'pessoal' && tab === 'collaborators') setTab('overview')
  }, [scope, tab])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: FONT_BODY, color: C.ink }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: ${C.faint}; }
        select option { background: ${C.surface2}; color: ${C.ink}; }
        ::selection { background: ${C.primarySoft}; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '28px 18px 64px' }}>
        <div style={{ marginBottom: 18 }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.inkSoft, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 9, padding: '8px 14px', textDecoration: 'none' }}>
            <span aria-hidden>←</span> Voltar ao BarberMeta
          </Link>
        </div>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.primary, textTransform: 'uppercase', marginBottom: 2 }}>BarberMeta</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 25, letterSpacing: -0.4, color: C.ink }}>Controle Financeiro</span>
              <span style={{ width: 7, height: 7, borderRadius: 8, background: C.primary, display: 'inline-block' }} />
            </div>
            <p style={{ margin: '4px 0 0', color: C.inkSoft, fontSize: 14 }}>Entradas, saídas, equipe e caixa — por mês, pessoa e empresa.</p>
            <button onClick={() => setShowGuide(true)} style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.primary, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 9, padding: '6px 12px', cursor: 'pointer' }}>
              Como usar
            </button>
          </div>
          <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 4 }}>
            {[['empresa', 'Empresa'], ['pessoal', 'Pessoal']].map(([id, label]) => {
              const active = scope === id
              return (
                <button key={id} onClick={() => setScope(id)} style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: active ? C.primaryInk : C.inkSoft, background: active ? C.primary : 'transparent', border: 'none', borderRadius: 9, padding: '8px 16px', cursor: 'pointer' }}>{label}</button>
              )
            })}
          </div>
        </header>

        <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 6, marginBottom: 22 }}>
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: '1 1 auto', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: active ? C.ink : C.inkSoft, background: active ? C.surface2 : 'transparent', border: active ? `1px solid ${C.line}` : '1px solid transparent', borderRadius: 9, padding: '9px 10px', cursor: 'pointer' }}>{t.label}</button>
            )
          })}
        </nav>

        {!ready ? (
          <Empty>Carregando seus dados…</Empty>
        ) : (
          <>
            {showMonth && <MonthNav month={month} setMonth={setMonth} />}
            {tab === 'overview' && <Overview {...{ scoped, combined, scope, month, setTab }} />}
            {tab === 'payables' && <Payables state={state} update={update} scope={scope} month={month} setMonth={setMonth} onSettle={settleBill('payables', -1)} onUnsettle={unsettleBill('payables', -1)} />}
            {tab === 'receivables' && <Receivables state={state} update={update} scope={scope} month={month} setMonth={setMonth} onSettle={settleBill('receivables', +1)} onUnsettle={unsettleBill('receivables', +1)} />}
            {tab === 'collaborators' && <Collaborators state={state} update={update} scope={scope} folha={folha} month={month} />}
            {tab === 'accounts' && <Accounts state={state} update={update} scope={scope} caixa={caixa} />}
          </>
        )}
      </div>

      {showGuide && <Guide onClose={closeGuide} />}
    </div>
  )
}

function Guide({ onClose }: any) {
  const steps = [
    ['Escolha o perfil', 'No topo, alterne entre Empresa (a barbearia) e Pessoal. Tudo fica separado entre os dois — contas, equipe e caixa.'],
    ['Cadastre seu caixa', 'Na aba Caixa, adicione onde está o dinheiro (conta no banco, dinheiro, Pix) e quanto tem em cada um.'],
    ['Lance as contas a pagar', 'Na aba A pagar, coloque aluguel, produtos, etc. Escolha se é Única, Fixa (todo mês) ou Parcelada, e informe o dia do vencimento.'],
    ['Lance o que tem a receber', 'Na aba A receber, registre valores que vão entrar.'],
    ['Cadastre a equipe', 'Na aba Colaboradores (só na Empresa), adicione barbeiros, recepcionistas e qualquer pessoa da equipe — com salário fixo ou comissão. A comissão você informa o valor a cada mês.'],
    ['Navegue pelos meses', 'Use as setas para mudar de mês. Conta fixa aparece sozinha todos os meses; o que você marca como pago é por mês.'],
    ['Marque pago/recebido pelo caixa', 'Ao marcar uma conta como paga, o app pergunta de qual caixa saiu e desconta dali. Ao receber, pergunta em qual caixa entrou e soma. Assim seu saldo fica sempre real.'],
    ['Veja o que sobra', 'Na Visão geral, o demonstrativo mostra quanto deve sobrar no mês. Como o dinheiro entra e sai do caixa de verdade, o saldo já segue certo para o mês seguinte.'],
  ]
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, maxWidth: 520, width: '100%', maxHeight: '86vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.primary, textTransform: 'uppercase' }}>BarberMeta</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>Como usar — passo a passo</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ fontSize: 20, lineHeight: 1, color: C.inkSoft, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: C.faint, margin: '0 0 16px' }}>Leva 1 minuto. Seus dados ficam salvos sozinhos, na nuvem (sincroniza entre aparelhos).</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map(([title, body], idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 13, background: C.primary, color: C.primaryInk, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{title}</div>
                <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ marginTop: 20, width: '100%', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, color: C.primaryInk, background: C.primary, border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}>
          Entendi, começar
        </button>
      </div>
    </div>
  )
}

function Overview({ scoped, combined, scope, month, setTab }: any) {
  const [view, setView] = useState('scope')
  const t = view === 'all' ? combined : scoped
  const single = view !== 'all'
  const scopeLabel = scope === 'empresa' ? 'Empresa' : 'Pessoal'
  const viewLabel = view === 'all' ? 'Empresa + Pessoal' : scopeLabel
  const sobraColor = t.sobra >= 0 ? C.in : C.out

  const segBtn = (id: string, label: string) => {
    const active = view === id
    return (
      <button onClick={() => setView(id)} style={{
        flex: '1 1 auto', fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5,
        color: active ? C.primaryInk : C.inkSoft, background: active ? C.primary : 'transparent',
        border: 'none', borderRadius: 9, padding: '9px 14px', cursor: 'pointer',
      }}>{label}</button>
    )
  }

  const Line = ({ label, value, color, onClick, sub, strong }: any) => (
    <div onClick={onClick} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      padding: strong ? '14px 6px 2px' : '11px 6px', borderTop: strong ? `1px solid ${C.line}` : 'none',
      marginTop: strong ? 4 : 0, cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: strong ? 15.5 : 14, fontWeight: strong ? 700 : 500, color: strong ? C.ink : C.inkSoft }}>{label}</span>
        {sub && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{sub}</div>}
      </div>
      <Num value={value} color={color} size={strong ? 26 : 15.5} weight={strong ? 700 : 600} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 4 }}>
        {segBtn('scope', `Só ${scopeLabel}`)}
        {segBtn('all', 'Empresa + Pessoal')}
      </div>

      {/* Card "Ja realizado em <mes>" — soma do que ja entrou e ja saiu
          do caixa. So aparece quando ha algo pra mostrar. */}
      {(t.pago > 0 || t.recebido > 0) && (
        <Card style={{ padding: '8px 18px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px 4px' }}>
            <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Já realizado em {monthLabel(month)}</div>
            <Badge color={C.in}>Concluído</Badge>
          </div>
          <Line
            label="✓ Já recebido"
            value={t.recebido}
            color={C.in}
            sub={t.recebido > 0 ? 'entrou no caixa' : undefined}
            onClick={() => setTab('receivables')}
          />
          <Line
            label="✓ Já pago"
            value={t.pago}
            color={C.out}
            sub={t.pago > 0 ? 'saiu do caixa' : undefined}
            onClick={() => setTab('payables')}
          />
        </Card>
      )}

      <Card style={{ padding: '8px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 6px 4px' }}>
          <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Demonstrativo de {monthLabel(month)}</div>
          <Badge color={C.primary}>{viewLabel}</Badge>
        </div>
        <Line label="Em caixa agora" value={t.caixa} color={C.ink} sub="saldo atual das suas contas" onClick={() => setTab('accounts')} />
        <Line label="+ A receber (falta entrar)" value={t.aReceber} color={C.in} onClick={() => setTab('receivables')} />
        <Line label="− A pagar (falta pagar)" value={t.aPagar} color={C.out} onClick={() => setTab('payables')} />
        {!(single && scope === 'pessoal') && (
          <Line label="− Folha (equipe)" value={t.folha} color={C.ink} onClick={() => setTab('collaborators')} />
        )}
        <Line label={`= Sobra prevista em ${monthLabel(month)}`} value={t.sobra} color={sobraColor} strong />
      </Card>

      <p style={{ fontSize: 12.5, color: C.faint, textAlign: 'center', margin: 0 }}>
        Ao marcar contas como pagas/recebidas, o dinheiro entra e sai do caixa real — então o saldo já segue certo para o mês seguinte, sem precisar transferir nada à mão.
      </p>
      <p style={{ fontSize: 13, color: C.faint, textAlign: 'center', margin: 0 }}>
        {single ? `Mostrando só ${scopeLabel}.` : 'Mostrando Empresa e Pessoal somados.'} Use as setas acima para mudar de mês; toque numa linha para abrir a aba.
      </p>
    </div>
  )
}

function BillSection({ items, scope, month, setMonth, onAdd, onSettle, onUnsettle, onRemove, onMove, onEdit, accounts, pickPrompt, showDest, destLabel, accent, addLabel, doneLabel }: any) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [due, setDue] = useState('')
  const [recurrence, setRecurrence] = useState('once')
  const [installments, setInstallments] = useState('2')
  const [dueDay, setDueDay] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [eDesc, setEDesc] = useState('')
  const [eAmount, setEAmount] = useState('')
  const [eDue, setEDue] = useState('')
  const [eRec, setERec] = useState('once')
  const [eInst, setEInst] = useState('2')
  const [eDay, setEDay] = useState('')
  const [dest, setDest] = useState('')
  const [eDest, setEDest] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const scopeLabel = scope === 'empresa' ? 'Empresa' : 'Pessoal'
  const otherLabel = scope === 'empresa' ? 'Pessoal' : 'Empresa'

  const submit = () => {
    if (!desc.trim() || !amount) return
    const startMonth = recurrence === 'once' ? (due ? due.slice(0, 7) : month) : month
    const day = (recurrence === 'fixed' || recurrence === 'installments') && dueDay ? Math.min(31, Math.max(1, parseInt(dueDay) || 0)) : null
    onAdd({
      id: uid(), scope, description: desc.trim(), amount: parseFloat(amount), dueDate: recurrence === 'once' ? due : '', dueDay: day,
      recurrence, installments: recurrence === 'installments' ? Math.max(2, parseInt(installments) || 2) : 1,
      destAccount: showDest && dest ? dest : null,
      startMonth, done: {},
    })
    setDesc(''); setAmount(''); setDue(''); setRecurrence('once'); setInstallments('2'); setDueDay(''); setDest('')
    if (startMonth !== month) setMonth(startMonth)
  }

  const appearing = items.filter((i: any) => i.scope === scope && appearsIn(i, month))
  const pending = appearing.filter((i: any) => !isDone(i, month))
  const done = appearing.filter((i: any) => isDone(i, month))
  const totalPending = pending.reduce((a: number, x: any) => a + (Number(x.amount) || 0), 0)

  const meta = (i: any) => {
    if (i.recurrence === 'fixed') return i.dueDay ? `Fixa · vence todo dia ${i.dueDay}` : 'Fixa · repete todo mês'
    if (i.recurrence === 'installments') {
      const d = i.dueDay ? ` · vence dia ${i.dueDay}` : ''
      return `Parcela ${monthDiff(month, i.startMonth) + 1}/${i.installments}${d} · total ${brl(i.amount * i.installments)}`
    }
    return i.dueDate ? `Vence ${fmtDate(i.dueDate)}` : 'Lançamento único'
  }
  const destName = (i: any) => {
    if (!i.destAccount) return null
    const a = accounts.find((x: any) => x.id === i.destAccount)
    return a ? a.name : null
  }

  const startEdit = (i: any) => {
    setEditId(i.id); setEDesc(i.description); setEAmount(String(i.amount))
    setEDue(i.dueDate || ''); setERec(i.recurrence); setEInst(String(i.installments || 2)); setEDay(i.dueDay ? String(i.dueDay) : '')
    setEDest(i.destAccount || '')
  }
  const saveEdit = () => {
    if (!eDesc.trim() || !eAmount) return
    const day = (eRec === 'fixed' || eRec === 'installments') && eDay ? Math.min(31, Math.max(1, parseInt(eDay) || 0)) : null
    onEdit(editId, {
      description: eDesc.trim(), amount: parseFloat(eAmount),
      recurrence: eRec, installments: eRec === 'installments' ? Math.max(2, parseInt(eInst) || 2) : 1,
      dueDate: eRec === 'once' ? eDue : '', dueDay: day,
      ...(showDest ? { destAccount: eDest || null } : {}),
    })
    setEditId(null)
  }
  const editForm = (i: any) => (
    <div key={i.id} style={{ background: C.surface, border: `1px solid ${C.primary}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Field label="Descrição" grow="2 1 160px"><input style={inputStyle} value={eDesc} onChange={(e) => setEDesc(e.target.value)} /></Field>
        <Field label="Valor (R$)"><input style={inputStyle} type="number" min="0" step="0.01" value={eAmount} onChange={(e) => setEAmount(e.target.value)} /></Field>
        <Field label="Repetição">
          <select style={inputStyle} value={eRec} onChange={(e) => setERec(e.target.value)}>
            <option value="once">Única</option>
            <option value="fixed">Fixa (mensal)</option>
            <option value="installments">Parcelada</option>
          </select>
        </Field>
        {eRec === 'installments' ? (
          <Field label="Parcelas" grow="0 1 100px"><input style={inputStyle} type="number" min="2" step="1" value={eInst} onChange={(e) => setEInst(e.target.value)} /></Field>
        ) : eRec === 'once' ? (
          <Field label="Vencimento"><input style={inputStyle} type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} /></Field>
        ) : null}
        {(eRec === 'fixed' || eRec === 'installments') && (
          <Field label="Dia do venc." grow="0 1 110px"><input style={inputStyle} type="number" min="1" max="31" step="1" value={eDay} onChange={(e) => setEDay(e.target.value)} placeholder="ex.: 10" /></Field>
        )}
        {showDest && (
          <Field label={destLabel} grow="1 1 160px">
            <select style={inputStyle} value={eDest} onChange={(e) => setEDest(e.target.value)}>
              <option value="">— perguntar ao receber —</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn small onClick={saveEdit}>Salvar</Btn>
        <Btn small tone="ghost" onClick={() => setEditId(null)}>Cancelar</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', flexWrap: 'wrap' }}>
        <Badge color={C.primary}>{scopeLabel}</Badge>
        <span style={{ fontSize: 12.5, color: C.faint }}>Lançamentos do perfil {scopeLabel}. Troque Empresa/Pessoal no topo, ou use &ldquo;mover&rdquo; em cada conta.</span>
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Descrição" grow="2 1 180px">
            <input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Fornecedor, aluguel…" />
          </Field>
          <Field label="Valor (R$)">
            <input style={inputStyle} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Repetição">
            <select style={inputStyle} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              <option value="once">Única</option>
              <option value="fixed">Fixa (mensal)</option>
              <option value="installments">Parcelada</option>
            </select>
          </Field>
          {recurrence === 'installments' ? (
            <Field label="Parcelas" grow="0 1 100px">
              <input style={inputStyle} type="number" min="2" step="1" value={installments} onChange={(e) => setInstallments(e.target.value)} />
            </Field>
          ) : recurrence === 'once' ? (
            <Field label="Vencimento">
              <input style={inputStyle} type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          ) : null}
          {(recurrence === 'fixed' || recurrence === 'installments') && (
            <Field label="Dia do venc." grow="0 1 110px">
              <input style={inputStyle} type="number" min="1" max="31" step="1" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="ex.: 10" />
            </Field>
          )}
          {showDest && (
            <Field label={destLabel} grow="1 1 160px">
              <select style={inputStyle} value={dest} onChange={(e) => setDest(e.target.value)}>
                <option value="">— perguntar ao receber —</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          )}
          <div style={{ flex: '0 0 auto' }}><Btn onClick={submit}>{addLabel}</Btn></div>
        </div>
        <p style={{ margin: '12px 4px 0', fontSize: 12.5, color: C.faint }}>
          Lançando em <strong style={{ color: C.inkSoft }}>{monthLabel(month)}</strong>. Conta fixa aparece sozinha nos próximos meses; parcelada se espalha mês a mês.
        </p>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: 13.5, color: C.inkSoft, fontWeight: 600 }}>{pending.length} em aberto em {monthLabel(month)}</span>
        <Num value={totalPending} color={accent} size={17} weight={700} />
      </div>

      {pending.length === 0 && done.length === 0 && <Empty>Nenhum lançamento neste mês. Adicione acima.</Empty>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pending.map((i: any) => {
          if (editId === i.id) return editForm(i)
          if (payingId === i.id) {
            const ordered = i.destAccount && accounts.some((a: any) => a.id === i.destAccount)
              ? [...accounts.filter((a: any) => a.id === i.destAccount), ...accounts.filter((a: any) => a.id !== i.destAccount)]
              : accounts
            return (
              <div key={i.id} style={{ background: C.surface, border: `1px solid ${C.primary}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{pickPrompt} <span style={{ color: C.faint, fontWeight: 400 }}>({brl(i.amount)})</span></div>
                {ordered.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: C.faint }}>Você ainda não tem caixa cadastrado. Cadastre na aba Caixa, ou conclua sem mexer no saldo.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ordered.map((a: any) => (
                      <Btn key={a.id} small onClick={() => { onSettle(i.id, month, a.id); setPayingId(null) }}>
                        {a.id === i.destAccount ? '★ ' : ''}{a.name} · {brl(a.balance)}
                      </Btn>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Btn small tone="ghost" onClick={() => { onSettle(i.id, month, null); setPayingId(null) }}>Concluir sem descontar</Btn>
                  <Btn small tone="ghost" onClick={() => setPayingId(null)}>Cancelar</Btn>
                </div>
              </div>
            )
          }
          return (
            <div key={i.id} style={rowStyle(accent)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</span>
                  {i.recurrence === 'fixed' && <Badge color={C.primary}>Fixa</Badge>}
                  {i.recurrence === 'installments' && <Badge color={C.primary}>{monthDiff(month, i.startMonth) + 1}/{i.installments}</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: C.faint, marginTop: 3 }}>
                  {meta(i)}
                  {destName(i) && <span> · cai em {destName(i)}</span>}
                  {' · '}
                  <span onClick={() => startEdit(i)} style={linkStyle}>editar</span>
                  {' · '}
                  <span onClick={() => onMove(i.id)} style={linkStyle}>mover p/ {otherLabel}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <Num value={i.amount} color={accent} />
                <Btn small tone="ghost" onClick={() => setPayingId(i.id)}>{doneLabel}</Btn>
                <Btn small tone="danger" onClick={() => onRemove(i.id)}>✕</Btn>
              </div>
            </div>
          )
        })}
      </div>

      {done.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 13, color: C.faint, fontWeight: 600, margin: '4px 4px 10px' }}>Concluídos em {monthLabel(month)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map((i: any) => {
              if (editId === i.id) return editForm(i)
              const di = i.done && i.done[month]
              const accId = di && typeof di === 'object' ? di.account : null
              const acc = accId ? accounts.find((a: any) => a.id === accId) : null
              return (
                <div key={i.id} style={rowStyle(C.line, true)}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ textDecoration: 'line-through', color: C.faint, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.description}</div>
                    <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>
                      {acc && <span>{acc.name} · </span>}
                      <span onClick={() => startEdit(i)} style={linkStyle}>editar</span>
                      {' · '}
                      <span onClick={() => onMove(i.id)} style={linkStyle}>mover p/ {otherLabel}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Num value={i.amount} color={C.faint} size={14} />
                    <Btn small tone="ghost" onClick={() => onUnsettle(i.id, month)}>Reabrir</Btn>
                    <Btn small tone="danger" onClick={() => onRemove(i.id)}>✕</Btn>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const flipScope = (arr: any[], id: string) =>
  arr.map((x: any) => (x.id === id ? { ...x, scope: x.scope === 'empresa' ? 'pessoal' : 'empresa' } : x))

function Payables({ state, update, scope, month, setMonth, onSettle, onUnsettle }: any) {
  const accounts = state.accounts.filter((a: any) => a.scope === scope)
  return (
    <BillSection items={state.payables} scope={scope} month={month} setMonth={setMonth} accounts={accounts} pickPrompt="Pagou de qual caixa?" addLabel="Adicionar conta" doneLabel="Marcar paga" accent={C.out}
      onAdd={(item: any) => update({ payables: [item, ...state.payables] })}
      onSettle={onSettle}
      onUnsettle={onUnsettle}
      onMove={(id: string) => update({ payables: flipScope(state.payables, id) })}
      onEdit={(id: string, patch: any) => update({ payables: state.payables.map((p: any) => (p.id === id ? { ...p, ...patch } : p)) })}
      onRemove={(id: string) => update({ payables: state.payables.filter((p: any) => p.id !== id) })} />
  )
}
function Receivables({ state, update, scope, month, setMonth, onSettle, onUnsettle }: any) {
  const accounts = state.accounts.filter((a: any) => a.scope === scope)
  return (
    <BillSection items={state.receivables} scope={scope} month={month} setMonth={setMonth} accounts={accounts} pickPrompt="Recebeu em qual caixa?" showDest destLabel="Cai em qual caixa?" addLabel="Adicionar recebimento" doneLabel="Marcar recebida" accent={C.in}
      onAdd={(item: any) => update({ receivables: [item, ...state.receivables] })}
      onSettle={onSettle}
      onUnsettle={onUnsettle}
      onMove={(id: string) => update({ receivables: flipScope(state.receivables, id) })}
      onEdit={(id: string, patch: any) => update({ receivables: state.receivables.map((r: any) => (r.id === id ? { ...r, ...patch } : r)) })}
      onRemove={(id: string) => update({ receivables: state.receivables.filter((r: any) => r.id !== id) })} />
  )
}

function Collaborators({ state, update, scope, folha, month }: any) {
  const [name, setName] = useState('')
  const [type, setType] = useState('salario')
  const [amount, setAmount] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [fullId, setFullId] = useState<string | null>(null)
  const [fName, setFName] = useState('')
  const [fType, setFType] = useState('salario')
  const [fVal, setFVal] = useState('')
  const [importando, setImportando] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  // Importa barbeiros + comissao acumulada do ciclo atual do BarberMeta.
  // Pra cada barbeiro: se ja existe colaborador com mesmo nome (case-insensitive),
  // atualiza monthly[mesAno] com a comissao. Se nao existe, cria como 'comissao'.
  const importarBM = async () => {
    setImportando(true); setImportMsg(null)
    try {
      const res = await buscarComissoesBarbermeta()
      if ('error' in res) { setImportMsg(res.error); return }
      const { mesAno, barbeiros } = res
      if (barbeiros.length === 0) {
        setImportMsg('Nenhum barbeiro ativo encontrado no BarberMeta.')
        return
      }

      const norm = (s: string) => s.trim().toLowerCase()
      const next = [...state.collaborators]
      let atualizados = 0
      let criados = 0
      for (const b of barbeiros) {
        const idx = next.findIndex((c: any) => c.scope === 'empresa' && c.type === 'comissao' && norm(c.name) === norm(b.nome))
        if (idx >= 0) {
          const c = next[idx]
          next[idx] = { ...c, monthly: { ...(c.monthly || {}), [mesAno]: b.comissao } }
          atualizados++
        } else {
          next.push({ id: uid(), scope: 'empresa', name: b.nome, type: 'comissao', monthly: { [mesAno]: b.comissao } })
          criados++
        }
      }
      update({ collaborators: next })
      setImportMsg(`Importados ${barbeiros.length} barbeiros para ${mesAno} (${criados} novos · ${atualizados} atualizados).`)
    } catch (e: any) {
      setImportMsg(e?.message || 'Erro ao importar.')
    } finally {
      setImportando(false)
    }
  }

  const submit = () => {
    if (!name.trim()) return
    const val = parseFloat(amount) || 0
    const base: any = { id: uid(), scope: 'empresa', name: name.trim(), type }
    const item = type === 'comissao'
      ? { ...base, monthly: val ? { [month]: val } : {} }
      : { ...base, amount: val }
    update({ collaborators: [item, ...state.collaborators] })
    setName(''); setAmount('')
  }
  const remove = (id: string) => update({ collaborators: state.collaborators.filter((c: any) => c.id !== id) })
  const startFull = (c: any) => {
    setFullId(c.id); setFName(c.name); setFType(c.type)
    setFVal(c.type === 'comissao' ? (c.monthly && c.monthly[month] != null ? String(c.monthly[month]) : '') : String(c.amount || ''))
  }
  const saveFull = () => {
    if (!fName.trim()) return
    const v = parseFloat(fVal) || 0
    update({
      collaborators: state.collaborators.map((x: any) => {
        if (x.id !== fullId) return x
        if (fType === 'comissao') {
          const { amount: _a, ...rest } = x
          return { ...rest, name: fName.trim(), type: 'comissao', monthly: { ...(x.monthly || {}), [month]: v } }
        }
        const { monthly: _m, ...rest } = x
        return { ...rest, name: fName.trim(), type: 'salario', amount: v }
      }),
    })
    setFullId(null)
  }
  const saveEdit = (c: any) => {
    const v = parseFloat(editVal) || 0
    update({
      collaborators: state.collaborators.map((x: any) => {
        if (x.id !== c.id) return x
        return c.type === 'comissao'
          ? { ...x, monthly: { ...(x.monthly || {}), [month]: v } }
          : { ...x, amount: v }
      }),
    })
    setEditing(null)
  }

  const visible = state.collaborators.filter((c: any) => c.scope === scope)
  const salarios = visible.filter((c: any) => c.type === 'salario').reduce((a: number, c: any) => a + (Number(c.amount) || 0), 0)
  const comissoes = visible.filter((c: any) => c.type === 'comissao').reduce((a: number, c: any) => a + collabValue(c, month), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Nome do colaborador" grow="2 1 180px">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria Silva" />
          </Field>
          <Field label="Tipo">
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="salario">Salário (fixo)</option>
              <option value="comissao">Comissão (por mês)</option>
            </select>
          </Field>
          <Field label={type === 'salario' ? 'Salário fixo (R$)' : `Comissão de ${monthLabel(month)} (R$)`}>
            <input style={inputStyle} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </Field>
          <div style={{ flex: '0 0 auto' }}><Btn onClick={submit}>Cadastrar</Btn></div>
        </div>
        <p style={{ margin: '12px 4px 0', fontSize: 12.5, color: C.faint }}>
          Salário entra igual todos os meses. Comissão você informa por mês — comece pela de <strong style={{ color: C.inkSoft }}>{monthLabel(month)}</strong> e ajuste nos próximos.
        </p>
      </Card>

      {/* Importar comissões do BarberMeta */}
      <Card style={{ background: C.surface, border: `1px dashed ${C.primary}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>
              <span style={{ marginRight: 6 }}>⚡</span>Importar comissões do BarberMeta
            </div>
            <div style={{ fontSize: 12.5, color: C.faint, marginTop: 4 }}>
              Puxa todos os barbeiros ativos e a comissão acumulada do ciclo atual.
              Cria os que faltam e atualiza os já cadastrados.
            </div>
          </div>
          <Btn small onClick={importarBM}>
            {importando ? 'Importando…' : 'Importar agora'}
          </Btn>
        </div>
        {importMsg && (
          <p style={{ margin: '10px 4px 0', fontSize: 12.5, color: C.in }}>{importMsg}</p>
        )}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 13.5, color: C.inkSoft, fontWeight: 600 }}>{visible.length} colaborador(es)</span>
        <span style={{ fontSize: 13.5, color: C.inkSoft }}>
          Folha de {monthLabel(month)} <Num value={folha} color={C.primary} size={16} weight={700} />
          <span style={{ color: C.faint }}> · salários {brl(salarios)} + comissões {brl(comissoes)}</span>
        </span>
      </div>

      {visible.length === 0 ? (
        <Empty>Nenhum colaborador cadastrado neste perfil ainda.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((c: any) => {
            const isComm = c.type === 'comissao'
            const val = collabValue(c, month)
            const notSet = isComm && !(c.monthly && c.monthly[month] != null)
            if (fullId === c.id) {
              return (
                <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.primary}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Field label="Nome do colaborador" grow="2 1 160px">
                      <input autoFocus style={inputStyle} value={fName} onChange={(e) => setFName(e.target.value)} />
                    </Field>
                    <Field label="Tipo">
                      <select style={inputStyle} value={fType} onChange={(e) => setFType(e.target.value)}>
                        <option value="salario">Salário (fixo)</option>
                        <option value="comissao">Comissão (por mês)</option>
                      </select>
                    </Field>
                    <Field label={fType === 'salario' ? 'Salário fixo (R$)' : `Comissão de ${monthLabel(month)} (R$)`}>
                      <input style={inputStyle} type="number" min="0" step="0.01" value={fVal} onChange={(e) => setFVal(e.target.value)} />
                    </Field>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn small onClick={saveFull}>Salvar</Btn>
                    <Btn small tone="ghost" onClick={() => setFullId(null)}>Cancelar</Btn>
                  </div>
                </div>
              )
            }
            return (
              <div key={c.id} style={rowStyle(isComm ? C.in : C.primary)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Badge color={isComm ? C.in : C.inkSoft}>{isComm ? 'Comissão' : 'Salário fixo'}</Badge>
                    <span style={{ fontSize: 12, color: C.faint }}>
                      {isComm ? (notSet ? `comissão de ${monthLabel(month)} não informada` : `referente a ${monthLabel(month)}`) : 'todo mês'}
                    </span>
                    <span onClick={() => startFull(c)} style={{ ...linkStyle, fontSize: 12 }}>editar</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {editing === c.id ? (
                    <>
                      <input autoFocus style={{ ...inputStyle, width: 120, padding: '7px 10px' }} type="number" min="0" step="0.01"
                        value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && saveEdit(c)} />
                      <Btn small onClick={() => saveEdit(c)}>Salvar</Btn>
                    </>
                  ) : (
                    <>
                      <Num value={val} color={notSet ? C.faint : C.ink} />
                      <Btn small tone="ghost" onClick={() => { setEditing(c.id); setEditVal(isComm ? (c.monthly && c.monthly[month] != null ? String(c.monthly[month]) : '') : String(c.amount)) }}>
                        {isComm ? (notSet ? 'Informar' : 'Editar') : 'Editar'}
                      </Btn>
                    </>
                  )}
                  <Btn small tone="danger" onClick={() => remove(c.id)}>✕</Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Accounts({ state, update, scope }: any) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editVal, setEditVal] = useState('')
  const submit = () => {
    if (!name.trim()) return
    update({ accounts: [{ id: uid(), scope, name: name.trim(), balance: parseFloat(balance) || 0 }, ...state.accounts] })
    setName(''); setBalance('')
  }
  const remove = (id: string) => update({ accounts: state.accounts.filter((a: any) => a.id !== id) })
  const startEdit = (a: any) => { setEditing(a.id); setEditName(a.name); setEditVal(String(a.balance)) }
  const saveEdit = (id: string) => {
    if (!editName.trim()) return
    update({ accounts: state.accounts.map((a: any) => (a.id === id ? { ...a, name: editName.trim(), balance: parseFloat(editVal) || 0 } : a)) })
    setEditing(null)
  }
  const visible = state.accounts.filter((a: any) => a.scope === scope)
  const total = visible.reduce((a: number, x: any) => a + (Number(x.balance) || 0), 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Field label="Nome da conta" grow="2 1 180px">
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Caixa, Banco, Carteira…" />
          </Field>
          <Field label="Valor em caixa (R$)">
            <input style={inputStyle} type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" />
          </Field>
          <div style={{ flex: '0 0 auto' }}><Btn onClick={submit}>Cadastrar conta</Btn></div>
        </div>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <span style={{ fontSize: 13.5, color: C.inkSoft, fontWeight: 600 }}>{visible.length} conta(s)</span>
        <span style={{ fontSize: 13.5, color: C.inkSoft }}>Total em caixa <Num value={total} color={C.primary} size={16} weight={700} /></span>
      </div>
      {visible.length === 0 ? (
        <Empty>Cadastre as contas (caixa, banco, carteira) deste perfil e o valor disponível em cada uma.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((a: any) => editing === a.id ? (
            <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.primary}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <Field label="Nome da conta" grow="2 1 160px">
                  <input autoFocus style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} />
                </Field>
                <Field label="Valor em caixa (R$)">
                  <input style={inputStyle} type="number" step="0.01" value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && saveEdit(a.id)} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={() => saveEdit(a.id)}>Salvar</Btn>
                <Btn small tone="ghost" onClick={() => setEditing(null)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div key={a.id} style={rowStyle(C.primary)}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <Num value={a.balance} color={C.primary} />
                <Btn small tone="ghost" onClick={() => startEdit(a)}>Editar</Btn>
                <Btn small tone="danger" onClick={() => remove(a.id)}>✕</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  if (!day) return d
  return `${day}/${m}/${y}`
}
