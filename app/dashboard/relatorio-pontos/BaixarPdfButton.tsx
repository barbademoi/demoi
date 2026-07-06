'use client'

// Abre a versão de impressão do relatório numa nova aba, que dispara o diálogo
// de impressão do navegador (Salvar como PDF). Reaproveita o mesmo padrão
// client-side já usado no app (sem servidor de PDF).
export default function BaixarPdfButton({ mes, ano }: { mes: number; ano: number }) {
  function abrir() {
    window.open(`/dashboard/relatorio-pontos/print?mes=${mes}&ano=${ano}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <button onClick={abrir} className="btn-primary text-sm whitespace-nowrap">
      Baixar PDF
    </button>
  )
}
