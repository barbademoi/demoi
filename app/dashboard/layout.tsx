import { redirect } from 'next/navigation'
import { verificarAssinatura } from '@/lib/assinatura/verificar'

// A trava lê a sessão a cada request — nada aqui pode ser estático, senão o
// acesso ficaria congelado no build.
export const dynamic = 'force-dynamic'

// Aplica o tema legível (bm-theme) a TODO o painel do dono sob /dashboard/*
// (campanha, metas, lançamentos, relatórios, feedback-cliente, conduta…),
// herdando exatamente os mesmos tokens da dashboard.
//
// É TAMBÉM a trava da assinatura: um ponto só, valendo pra todas as telas do
// dono, em vez de repetir a checagem em cada página e esquecer de uma.
// VITALÍCIO nunca é barrado aqui — avaliarAcesso devolve 'vitalicio' e sai.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const acesso = await verificarAssinatura()
  if (!acesso.liberado) redirect('/assinatura')

  return <div className="bm-theme min-h-screen">{children}</div>
}
