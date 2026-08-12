type Props = {
  className?: string
}

export default function CarouselNudge({ className = '' }: Props) {
  return (
    <span
      className={`carousel-nudge pointer-events-none absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-[#FFD84D] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#08111F] shadow-[0_10px_30px_rgba(255,216,77,0.45)] ${className}`}
      aria-hidden="true"
    >
      Veja mais
      <span className="text-lg leading-none">›</span>
    </span>
  )
}
