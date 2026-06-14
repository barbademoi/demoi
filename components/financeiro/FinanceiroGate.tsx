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
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 6px' }}>Plus: Financeiro + Feedback Premiado</h2>
            <p style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.5, margin: '0 0 14px' }}>
              Desbloqueie de uma vez os 2 módulos premium:
            </p>
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 14, margin: '0 0 18px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13.5, lineHeight: 1.5 }}>
              <li style={{ marginBottom: 8, color: C.ink }}>
                <span style={{ color: C.primary, marginRight: 6 }}>✓</span>
                <strong>Controle Financeiro</strong> — <span style={{ color: C.inkSoft }}>caixa, contas a pagar/receber, folha (auto-sync) e fluxo de caixa</span>
              </li>
              <li style={{ color: C.ink }}>
                <span style={{ color: C.primary, marginRight: 6 }}>✓</span>
                <strong>Feedback Premiado</strong> — <span style={{ color: C.inkSoft }}>link público pra avaliação, brindes sorteados e direcionamento pro Google</span>
              </li>
            </ul>

            <a href={checkoutUrl} target="_blank" rel="noreferrer"
              style={{ display: 'block', textDecoration: 'none', fontWeight: 700, fontSize: 15.5, color: C.primaryInk, background: C.primary, borderRadius: 10, padding: '13px 16px' }}>
              Desbloquear Plus — R$ 29
            </a>

            <button onClick={check}
              style={{ marginTop: 12, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.inkSoft, background: 'transparent', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', width: '100%' }}>
              Já comprei — atualizar acesso
            </button>

            <p style={{ color: C.faint, fontSize: 12, marginTop: 14 }}>
              Pagamento único, sem mensalidade. Após a compra, liberação automática.
              Se você comprou com um e-mail diferente do seu login, fale com o suporte.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
