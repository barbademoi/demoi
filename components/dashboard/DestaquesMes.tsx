import type { DestaquesMes } from '@/lib/destaquesMes'

// Widget "Destaques do mês" — SÓ no painel do dono (renderizado dentro do
// DashboardShell, que é privado). O barbeiro (/b/[codigo]) não recebe nada
// disso. Usa os mesmos tokens do dashboard (card, text-text, latão, primary).

interface CardProps {
  emoji: string
  rotulo: string
  nome: string | null
  valorFmt: string | null
  empatadoCom?: string | null
  destaque?: boolean   // ênfase em latão
}

function DestaqueCard({ emoji, rotulo, nome, valorFmt, empatadoCom, destaque }: CardProps) {
  const vazio = !nome || !valorFmt
  return (
    <div className={`card p-4 flex flex-col gap-1 ${destaque ? 'border-[#E8A855]/40' : ''}`}>
      <p className="text-text-muted text-xs font-sans uppercase tracking-wide flex items-center gap-1.5">
        <span aria-hidden>{emoji}</span> {rotulo}
      </p>
      {vazio ? (
        <p className="text-text-muted text-sm font-sans mt-1 leading-snug">
          Ainda sem dados suficientes neste ciclo.
        </p>
      ) : (
        <>
          <p className="text-text font-sans font-semibold text-lg leading-tight truncate">{nome}</p>
          <p className={`font-serif text-2xl tabular-nums ${destaque ? 'metal-text-gold' : 'text-primary'}`}>
            {valorFmt}
          </p>
          {empatadoCom && (
            <p className="text-text-muted text-xs font-sans">empatado com {empatadoCom}</p>
          )}
        </>
      )}
    </div>
  )
}

export default function DestaquesMes({ destaques }: { destaques: DestaquesMes }) {
  return (
    <section aria-label="Destaques do mês" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-xl text-text">Destaques do mês</h2>
        <span className="text-text-muted text-xs font-sans">só você vê</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DestaqueCard
          emoji="🏅"
          rotulo="Maior pontuação"
          nome={destaques.pontuacao?.nome ?? null}
          valorFmt={destaques.pontuacao?.valorFmt ?? null}
          empatadoCom={destaques.pontuacao?.empatadoCom}
        />
        <DestaqueCard
          emoji="💰"
          rotulo={destaques.faturamentoLabel}
          nome={destaques.faturamento?.nome ?? null}
          valorFmt={destaques.faturamento?.valorFmt ?? null}
          empatadoCom={destaques.faturamento?.empatadoCom}
        />
        <DestaqueCard
          emoji="📈"
          rotulo="Maior evolução"
          nome={destaques.evolucao?.nome ?? null}
          valorFmt={destaques.evolucao?.valorFmt ?? null}
          empatadoCom={destaques.evolucao?.empatadoCom}
          destaque
        />
      </div>
    </section>
  )
}
