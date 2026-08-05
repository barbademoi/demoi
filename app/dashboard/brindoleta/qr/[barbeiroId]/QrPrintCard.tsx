'use client'

import BrindoletaQr from '@/components/brindoleta/BrindoletaQr'

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

      <section className="qr-print-sheet relative mx-auto flex h-[10cm] w-[10cm] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#0c0e0a] p-[0.4cm] text-white shadow-xl">
        {/* Fundo: brilho da marca + malha discreta */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 82% -6%, rgba(216,255,0,.22), transparent 40%), radial-gradient(circle at 6% 108%, rgba(53,183,235,.12), transparent 42%)' }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '.5cm .5cm' }} />

        {/* Cabeçalho */}
        <header className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-[0.16cm]">
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt="" className="h-[0.72cm] w-[0.72cm] rounded-full bg-white object-cover ring-1 ring-white/25" />
            ) : (
              <span className="flex h-[0.72cm] w-[0.72cm] items-center justify-center rounded-full bg-[#d8ff00] text-[10px] font-black text-[#11130f]">{initials(businessName)}</span>
            )}
            <strong className="truncate text-[11px] font-black uppercase tracking-[0.06em]">{businessName}</strong>
          </div>
          <span className="flex shrink-0 items-center gap-[0.1cm] rounded-full border border-[#d8ff00]/30 bg-[#d8ff00]/10 px-[0.16cm] py-[0.06cm] text-[8px] font-black uppercase tracking-[0.16em] text-[#d8ff00]">
            <span className="inline-block h-[0.24cm] w-[0.24cm] rounded-full border-[1.5px] border-white/70 bg-[conic-gradient(#d8ff00_0_60deg,#ff6045_60deg_120deg,#ffd149_120deg_180deg,#35b7eb_180deg_240deg,#9365ed_240deg_300deg,#f44696_300deg)]" />
            Brindoleta
          </span>
        </header>

        {/* Chamada */}
        <div className="relative mt-[0.12cm] text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.28em] text-[#d8ff00]">Roleta premiada</p>
          <h1 className="mt-[0.03cm] text-[23px] font-black uppercase leading-[0.9] tracking-[-0.02em] text-[#d8ff00]" style={{ textShadow: '0 0 0.35cm rgba(216,255,0,.28)' }}>Escaneie e gire</h1>
          <p className="mt-[0.06cm] text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">Descubra seu benefício na hora</p>
        </div>

        {/* QR */}
        <div className="relative mx-auto mt-[0.12cm] rounded-[0.32cm] border-[0.055cm] border-[#d8ff00] bg-white p-[0.11cm] shadow-[0_0.18cm_0.42cm_rgba(0,0,0,.4)]">
          <BrindoletaQr value={publicUrl} label={`QR Code da Brindoleta de ${barberName}`} className="h-[5.15cm] w-[5.15cm]" />
        </div>

        {/* Rodapé */}
        <footer className="relative mt-auto">
          <div className="flex items-center justify-center gap-[0.16cm] pt-[0.14cm]">
            {barberPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={barberPhoto} alt="" className="h-[0.68cm] w-[0.68cm] rounded-full object-cover ring-1 ring-white/25" />
            ) : (
              <span className="flex h-[0.68cm] w-[0.68cm] items-center justify-center rounded-full bg-white/10 text-[9px] font-black">{initials(barberName)}</span>
            )}
            <p className="text-[10px] text-white/70">Atendimento com <strong className="text-white">{barberName}</strong></p>
          </div>
          <div className="mt-[0.12cm] flex items-center justify-center gap-[0.2cm] border-t border-white/12 pt-[0.1cm] text-[7.5px] font-black uppercase tracking-[0.14em] text-white/45">
            <span>1 giro por dia</span>
            <span className="inline-block h-[0.06cm] w-[0.06cm] rounded-full bg-[#d8ff00]" />
            <span>Ofertas exclusivas</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
