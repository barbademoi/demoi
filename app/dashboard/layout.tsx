// Aplica o tema legível (bm-theme) a TODO o painel do dono sob /dashboard/*
// (campanha, metas, lançamentos, relatórios, feedback-cliente, conduta…),
// herdando exatamente os mesmos tokens da dashboard. Só camada visual.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="bm-theme min-h-screen">{children}</div>
}
