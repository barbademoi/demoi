'use client'

const segments = [
  { label: 'DESCONTO', angle: 30 },
  { label: 'PRODUTO', angle: 90 },
  { label: 'BRINDE', angle: 150 },
  { label: 'SERVIÇO', angle: 210 },
  { label: 'BÔNUS', angle: 270 },
  { label: 'SURPRESA', angle: 330 },
]

export default function BrindoletaDemo() {
  return (
    <div className="relative isolate overflow-hidden border-b border-white/10 bg-[#0d0d0b] px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
      <div className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(216,255,0,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(216,255,0,0.07)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Demonstração ao vivo</p>
          <p className="mt-1 text-sm font-semibold text-white">A experiência que seu cliente vê</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#d8ff00]" />
          Giro em andamento
        </span>
      </div>

      <div className="relative mx-auto flex min-h-[250px] max-w-md items-center justify-center">
        <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2 drop-shadow-[0_5px_7px_rgba(0,0,0,0.75)]">
          <div className="demo-pointer h-0 w-0 border-l-[15px] border-r-[15px] border-t-[29px] border-l-transparent border-r-transparent border-t-primary" />
        </div>

        <div className="relative h-[226px] w-[226px] sm:h-[246px] sm:w-[246px]">
          <div
            className="demo-wheel absolute inset-0 rounded-full border-[9px] border-[#292923] shadow-[0_0_0_3px_#f7f2e8,0_18px_45px_rgba(0,0,0,0.7),0_0_42px_rgba(216,255,0,0.12)]"
            style={{
              background: 'conic-gradient(from -30deg, #d8ff00 0 60deg, #ff6045 60deg 120deg, #ffd149 120deg 180deg, #35b7eb 180deg 240deg, #9365ed 240deg 300deg, #f44696 300deg 360deg)',
            }}
          >
            <div className="absolute inset-2 rounded-full border border-black/25" />
            {segments.map((segment) => (
              <span
                key={segment.label}
                className="absolute left-1/2 top-1/2 -ml-7 -mt-2 w-14 text-center text-[8px] font-black uppercase leading-none tracking-[-0.02em] text-[#11110f] sm:text-[9px]"
                style={{ transform: `rotate(${segment.angle}deg) translateY(-82px) rotate(${-segment.angle}deg)` }}
              >
                {segment.label}
              </span>
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 z-20 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#f7f2e8] bg-[#11110f] shadow-[0_7px_18px_rgba(0,0,0,0.6)]">
            <div className="text-center">
              <span className="block text-base font-black uppercase tracking-wide text-white">Girar</span>
              <span className="block text-[7px] font-bold uppercase tracking-[0.18em] text-primary">a roleta</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto h-1 max-w-sm overflow-hidden rounded-full bg-white/10">
        <div className="demo-progress h-full origin-left rounded-full bg-primary shadow-[0_0_10px_rgba(216,255,0,0.75)]" />
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55">
        Gira · desacelera · revela a oferta
      </p>

      <style jsx>{`
        .demo-wheel {
          animation: brindoleta-spin 5.4s cubic-bezier(0.12, 0.72, 0.16, 1) infinite;
          will-change: transform;
        }

        .demo-pointer {
          animation: brindoleta-pointer 180ms ease-in-out infinite alternate;
          transform-origin: 50% 0;
        }

        .demo-progress {
          animation: brindoleta-progress 5.4s linear infinite;
        }

        @keyframes brindoleta-spin {
          0%, 10% { transform: rotate(0deg); }
          68% { transform: rotate(1260deg); }
          84%, 100% { transform: rotate(1440deg); }
        }

        @keyframes brindoleta-pointer {
          from { transform: rotate(-2deg); }
          to { transform: rotate(2deg); }
        }

        @keyframes brindoleta-progress {
          0% { transform: scaleX(0); opacity: 1; }
          84% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0.25; }
        }

        @media (prefers-reduced-motion: reduce) {
          .demo-wheel, .demo-pointer, .demo-progress { animation: none; }
          .demo-progress { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}
