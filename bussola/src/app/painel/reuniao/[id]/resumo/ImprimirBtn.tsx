'use client'

export default function ImprimirBtn() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary w-full py-3 text-sm print:hidden">
      Imprimir / Baixar PDF
    </button>
  )
}
