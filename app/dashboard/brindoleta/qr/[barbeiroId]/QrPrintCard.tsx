'use client'

import QrCardSheet from '@/components/brindoleta/QrCardSheet'

type Props = {
  businessName: string
  businessLogo: string | null
  barberName: string
  barberPhoto: string | null
  publicUrl: string
}

export default function QrPrintCard(props: Props) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e9e7df] to-[#d8d5ca] px-4 py-6 text-[#11130f] print:min-h-0 print:bg-white print:p-0">
      <style>{`
        @page { size: 10cm 10cm; margin: 0; }
        /* Faz o navegador IMPRIMIR o fundo escuro e as cores (senão sai tudo branco). */
        .qr-print-sheet { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print {
          html, body { width: 10cm; height: 10cm; margin: 0 !important; padding: 0 !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .qr-print-controls { display: none !important; }
          .qr-print-sheet { width: 10cm !important; height: 10cm !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="qr-print-controls mx-auto mb-5 max-w-md rounded-2xl border border-black/10 bg-white/80 p-4 shadow-lg backdrop-blur">
        <p className="mb-1 text-sm font-black">Cartão 10 × 10 cm pronto</p>
        <p className="mb-3 text-xs leading-relaxed text-black/60">
          Ao imprimir, use <strong>escala 100%</strong> e <strong>ative “Gráficos de segundo plano”</strong> (em “Mais
          definições”), senão o fundo sai branco. Papel adesivo ou couché deixa o QR mais nítido.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => window.print()} className="min-h-[48px] flex-1 rounded-xl bg-[#d8ff00] px-5 py-3 text-sm font-black shadow-[0_8px_20px_rgba(120,140,0,.16)] transition hover:brightness-105">Imprimir / salvar em PDF</button>
          <button type="button" onClick={() => window.close()} className="min-h-[48px] rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-bold transition hover:bg-black/[0.03]">Fechar</button>
        </div>
      </div>

      <div className="mx-auto w-[10cm]">
        <QrCardSheet {...props} />
      </div>
    </main>
  )
}
