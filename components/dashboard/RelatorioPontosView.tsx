import type { RelatorioPontos, AtividadeLinha } from '@/lib/relatorioPontos'

// Blocos do relatório de conferência (Total da equipe + Detalhe por barbeiro).
// Componente puro reutilizado pela tela do dono e pela versão de impressão/PDF,
// pra o visual bater exatamente nos dois.

function TabelaAtividades({ atividades, total, totalLabel }: {
  atividades: AtividadeLinha[]
  total: number
  totalLabel: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans border-collapse">
        <thead>
          <tr className="text-text-muted text-xs uppercase tracking-wide">
            <th className="text-left font-semibold py-2 pr-2">Atividade</th>
            <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Qtd</th>
            <th className="text-right font-semibold py-2 px-2 whitespace-nowrap">Pts/un.</th>
            <th className="text-right font-semibold py-2 pl-2 whitespace-nowrap">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {atividades.map(a => (
            <tr key={a.servicoId} className="border-t border-border">
              <td className="py-2 pr-2 text-text">
                <span className="mr-1">{a.emoji}</span>{a.nome}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-text">{a.qtd}</td>
              <td className="py-2 px-2 text-right tabular-nums text-text-muted">{a.pontosUnit}</td>
              <td className="py-2 pl-2 text-right tabular-nums font-semibold text-text">{a.pontosTotais}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border">
            <td className="py-2 pr-2 font-serif text-text" colSpan={3}>{totalLabel}</td>
            <td className="py-2 pl-2 text-right tabular-nums font-serif text-lg text-primary">{total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function RelatorioPontosView({ relatorio }: { relatorio: RelatorioPontos }) {
  const semDados = relatorio.atividadesEquipe.length === 0
  return (
    <div className="space-y-6">
      {/* BLOCO 1 — Total da equipe */}
      <section className="card p-5">
        <h2 className="font-serif text-lg text-text mb-1">Total da equipe</h2>
        <p className="text-text-muted text-xs font-sans mb-3">
          {relatorio.totalLancamentos} lançamento{relatorio.totalLancamentos !== 1 ? 's' : ''} no período.
        </p>
        {semDados ? (
          <p className="text-text-muted text-sm font-sans py-2">Nenhum lançamento de pontos neste período.</p>
        ) : (
          <TabelaAtividades atividades={relatorio.atividadesEquipe} total={relatorio.totalEquipe} totalLabel="Total da equipe" />
        )}
      </section>

      {/* BLOCO 2 — Detalhe por barbeiro */}
      {!semDados && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg text-text px-1">Detalhe por barbeiro</h2>
          {relatorio.barbeiros.map(b => (
            <div key={b.barbeiroId} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-sans font-semibold text-text">{b.nome}</p>
                  {b.tipo === 'recepcionista' && <p className="text-text-muted text-xs font-sans">Recepcionista</p>}
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-[11px] font-sans uppercase tracking-wide">Subtotal</p>
                  <p className="font-serif text-xl text-primary tabular-nums">{b.subtotal}</p>
                </div>
              </div>
              <TabelaAtividades atividades={b.atividades} total={b.subtotal} totalLabel={`Subtotal ${b.nome.split(' ')[0]}`} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
