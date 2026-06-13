'use client'

// Cadeado do Controle Financeiro.
// Verifica via RPC has_financeiro() se o e-mail logado tem liberacao ativa.
// Se sim, renderiza o conteudo; se nao, mostra tela de upsell com checkoutUrl.
// A trava REAL eh no RLS do banco — esse gate eh so UX.

import { useEffect, useState, type ReactNode } from 'react'
import { hasFinanceiro } from '@/lib/financeiro/supabaseStore'

const C = {
  bg: '#333B43', surface: '#3F4954', ink: '#F6F9FB', inkSoft: '#C4CDD4',
  faint: '#8B96A0', line: '#54606B', primary: '#D2AE62', primaryInk: '#27313A',
}
const FONT = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

type Status = 'loading' | 'unlocked' | 'locked'

interface Props {
  children: ReactNode
  checkoutUrl: string
}

export default function FinanceiroGate({ children, checkoutUrl }: Props) {
  const [status, setStatus] = useState<Status>('loading')

  const check = () => {
    setStatus('loading')
    hasFinanceiro().then((ok) => setStatus(ok ? 'unlocked' : 'locked'))
  }
  useEffect(() => { check() }, [])

  if (status === 'unlocked') return <>{children}</>

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 460, width: '100%', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: C.primary, textTransform: 'uppercase' }}>BarberMeta Plus</div>

        {status === 'loading' ? (
          <p style={{ color: C.inkSoft, marginTop: 16 }}>Verificando seu acesso…</p>
        ) : (
          <>
            <div style={{ fontSize: 40, marginTop: 8 }}>🔒</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>Controle Financeiro</h2>
            <p style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>
              Caixa, contas a pagar e receber, comissão da equipe e quanto sobra no mês — tudo num lugar só.
              Esse módulo é um adicional do BarberMeta.
            </p>

            <a href={checkoutUrl} target="_blank" rel="noreferrer"
              style={{ display: 'block', textDecoration: 'none', fontWeight: 700, fontSize: 15.5, color: C.primaryInk, background: C.primary, borderRadius: 10, padding: '13px 16px' }}>
              Desbloquear agora
            </a>

            <button onClick={check}
              style={{ marginTop: 12, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.inkSoft, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', width: '100%' }}>
              Já comprei — atualizar acesso
            </button>

            <p style={{ color: C.faint, fontSize: 12, marginTop: 14 }}>
              Após a compra, a liberação é automática. Se você comprou com um e-mail diferente do seu login, fale com o suporte.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
