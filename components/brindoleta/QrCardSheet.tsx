import BrindoletaQr from '@/components/brindoleta/BrindoletaQr'

export type QrCardData = {
  businessName: string
  businessLogo: string | null
  barberName: string
  barberPhoto: string | null
  publicUrl: string
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

/**
 * Cartão 10 × 10 cm da Brindoleta (só a arte, sem controles). Reaproveitado na
 * impressão individual e na de "todos". A regra @page e o print-color-adjust
 * ficam na página que renderiza este cartão.
 */
export default function QrCardSheet({ businessName, businessLogo, barberName, barberPhoto, publicUrl }: QrCardData) {
  return (
    <section className="qr-print-sheet relative flex h-[10cm] w-[10cm] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#0c0e0a] p-[0.4cm] text-white shadow-xl">
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
  )
}
