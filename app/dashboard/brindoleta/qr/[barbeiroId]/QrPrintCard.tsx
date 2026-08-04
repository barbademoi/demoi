'use client'

type Props = {
  businessName: string
  businessLogo: string | null
  barberName: string
  barberPhoto: string | null
  publicUrl: string
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export default function QrPrintCard({ businessName, businessLogo, barberName, barberPhoto, publicUrl }: Props) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&margin=12&data=${encodeURIComponent(publicUrl)}`

  return (
    <main className="min-h-screen bg-[#e9e7df] px-4 py-6 text-[#11130f] print:min-h-0 print:bg-white print:p-0">
      <style>{`
        @page { size: 10cm 10cm; margin: 0; }
        @media print {
          html, body { width: 10cm; height: 10cm; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .qr-print-controls { display: none !important; }
          .qr-print-sheet { width: 10cm !important; height: 10cm !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="qr-print-controls mx-auto mb-5 flex max-w-md flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl bg-[#d8ff00] px-5 py-3 text-sm font-black">Imprimir / salvar em PDF</button>
        <button type="button" onClick={() => window.close()} className="rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-bold">Fechar</button>
      </div>

      <section className="qr-print-sheet relative mx-auto flex h-[10cm] w-[10cm] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#11130f] p-[0.45cm] text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(216,255,0,.2), transparent 38%), linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: 'auto, .5cm .5cm, .5cm .5cm' }} />

        <header className="relative flex items-center justify-between gap-2 border-b border-white/15 pb-[0.2cm]">
          <div className="flex min-w-0 items-center gap-[0.16cm]">
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt="" className="h-[0.7cm] w-[0.7cm] rounded-full bg-white object-cover" />
            ) : (
              <span className="flex h-[0.7cm] w-[0.7cm] items-center justify-center rounded-full bg-[#d8ff00] text-[9px] font-black text-[#11130f]">{initials(businessName)}</span>
            )}
            <strong className="truncate text-[10px] uppercase tracking-[0.08em]">{businessName}</strong>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#d8ff00]">Brindoleta</span>
        </header>

        <div className="relative mt-[0.22cm] text-center">
          <p className="text-[7px] font-black uppercase tracking-[0.22em] text-[#d8ff00]">Roleta premiada</p>
          <h1 className="mt-[0.05cm] font-serif text-[22px] leading-none">Escaneie. Gire. Ganhe.</h1>
          <p className="mt-[0.08cm] text-[8px] text-white/65">Aponte a câmera do celular para o QR Code.</p>
        </div>

        <div className="relative mx-auto mt-[0.18cm] rounded-[0.28cm] bg-white p-[0.12cm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR Code da Brindoleta de ${barberName}`} className="h-[5.1cm] w-[5.1cm]" />
        </div>

        <footer className="relative mt-auto flex items-center justify-center gap-[0.16cm] pt-[0.17cm]">
          {barberPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={barberPhoto} alt="" className="h-[0.65cm] w-[0.65cm] rounded-full object-cover" />
          ) : (
            <span className="flex h-[0.65cm] w-[0.65cm] items-center justify-center rounded-full bg-white/10 text-[8px] font-black">{initials(barberName)}</span>
          )}
          <p className="text-[9px] text-white/65">Atendimento com <strong className="text-white">{barberName}</strong></p>
        </footer>
      </section>
    </main>
  )
}
