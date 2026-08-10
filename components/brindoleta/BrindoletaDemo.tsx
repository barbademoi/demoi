'use client'

const offers = [
  { title: 'Limpeza', benefit: '20% OFF', angle: 0, color: '#9365ed' },
  { title: 'Pomada', benefit: '30% OFF', angle: 60, color: '#f44696' },
  { title: 'Shampoo', benefit: '20% OFF', angle: 120, color: '#d8ff00' },
  { title: 'Leave-in', benefit: '20% OFF', angle: 180, color: '#ff6045' },
  { title: 'Hidratação', benefit: '25% OFF', angle: 240, color: '#ffd149' },
  { title: 'Depilação', benefit: '20% OFF', angle: 300, color: '#35b7eb' },
]

export default function BrindoletaDemo() {
  const gradient = `conic-gradient(from -30deg, ${offers
    .map((offer, index) => `${offer.color} ${index * 60}deg ${(index + 1) * 60}deg`)
    .join(', ')})`

  return (
    <div className="relative isolate overflow-hidden border-b border-white/10 bg-[#0b0c09] px-3 pb-5 pt-4 sm:px-6 sm:pb-6">
      <div className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(216,255,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(216,255,0,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[#d8ff00]/10 blur-3xl" />

      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8ff00]">Demonstração real</p>
          <p className="mt-1 max-w-[190px] text-sm font-semibold leading-snug text-white sm:max-w-none">
            Veja o giro e o prêmio que o cliente recebe
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d8ff00]/30 bg-[#d8ff00]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#d8ff00]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff00] shadow-[0_0_8px_#d8ff00]" />
          Exemplo real
        </span>
      </div>

      <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/20 px-2 pb-4 pt-4 sm:px-4">
        <div className="text-center">
          <p className="text-base font-black uppercase tracking-[0.03em] text-white">
            <span className="text-[#d8ff00]">Roleta</span> premiada
          </p>
          <span className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-[#d8ff00]/25 bg-[#d8ff00]/10 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.16em] text-white/75">
            <i className="flex h-4 w-4 items-center justify-center rounded-full bg-[#d8ff00] text-[9px] not-italic text-[#11110f]">1</i>
            Giro liberado
          </span>
        </div>

        <div className="relative mx-auto mt-3 flex min-h-[246px] items-center justify-center sm:min-h-[266px]">
          <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 drop-shadow-[0_5px_7px_rgba(0,0,0,0.75)]">
            <div className="demo-pointer h-0 w-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#d8ff00]" />
          </div>

          <div className="relative h-[226px] w-[226px] sm:h-[246px] sm:w-[246px]">
            <div
              className="demo-wheel absolute inset-0 rounded-full border-[9px] border-[#272821] shadow-[0_0_0_3px_#f7f2e8,0_16px_38px_rgba(0,0,0,0.72)]"
              style={{ background: gradient }}
            >
              <div className="absolute inset-2 rounded-full border border-black/25" />
              {offers.map((offer) => (
                <span
                  key={offer.title}
                  className="demo-label absolute left-1/2 top-1/2 -ml-[32px] -mt-5 flex h-10 w-16 flex-col items-center justify-center text-center text-[#11110f]"
                  style={{ transform: `rotate(${offer.angle}deg) translateY(-78px) rotate(${-offer.angle}deg)` }}
                >
                  <strong className="block whitespace-nowrap text-[8px] font-black uppercase leading-none tracking-[-0.02em] sm:text-[9px]">
                    {offer.title}
                  </strong>
                  <small className="mt-1 inline-flex rounded-sm border border-black/20 bg-white/75 px-1.5 py-0.5 text-[6px] font-black uppercase leading-none tracking-[0.02em] shadow-sm sm:text-[6.5px]">
                    {offer.benefit}
                  </small>
                </span>
              ))}
            </div>

            <div className="absolute left-1/2 top-1/2 z-20 flex h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#f7f2e8] bg-[#11110f] shadow-[0_7px_18px_rgba(0,0,0,0.62)]">
              <div className="text-center">
                <span className="block text-lg font-black uppercase tracking-wide text-white">Girar</span>
                <span className="block text-[7px] font-bold uppercase tracking-[0.18em] text-[#d8ff00]">a roleta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-1 h-1 max-w-sm overflow-hidden rounded-full bg-white/10">
          <div className="demo-progress h-full origin-left rounded-full bg-[#d8ff00] shadow-[0_0_10px_rgba(216,255,0,0.75)]" />
        </div>
        <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
          Gira · desacelera · revela a oferta
        </p>

        <div className="demo-prize absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3 backdrop-blur-[6px]" aria-hidden="true">
          <div className="relative w-full max-w-[330px] overflow-hidden rounded-md bg-[#f4f1e8] px-5 pb-5 pt-9 text-center text-[#151610] shadow-[0_24px_60px_rgba(0,0,0,0.65)] sm:px-7 sm:pb-6 sm:pt-10">
            <div className="absolute inset-x-0 top-0 h-2 bg-[#9365ed]" />
            <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#e5e1d6] text-lg leading-none text-[#696c62]">×</span>

            <i className="absolute left-6 top-12 h-4 w-1.5 rotate-[22deg] bg-[#ff6045]" />
            <i className="absolute right-8 top-20 h-2 w-2 rounded-full bg-[#35b7eb]" />
            <i className="absolute bottom-24 left-5 h-4 w-1.5 -rotate-[35deg] bg-[#d8ff00]" />
            <i className="absolute right-20 top-8 h-4 w-1.5 rotate-[68deg] bg-[#9365ed]" />

            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5d620f]">Você desbloqueou</p>
            <span className="mt-2 inline-block rounded-full border border-[#c9c5b9] px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-[#6c6f65]">Serviço</span>
            <h3 className="mx-auto mt-3 max-w-[240px] font-serif text-[30px] leading-[0.94] tracking-[-0.04em] text-[#151610] sm:text-[34px]">
              20% OFF LIMPEZA DE PELE
            </h3>
            <strong className="mt-2 block text-lg text-[#577000]">R$ 10,00 de desconto</strong>
            <p className="mx-auto mt-3 max-w-[250px] text-xs leading-relaxed text-[#6f7268]">
              Aproveite agora e torne sua experiência ainda mais completa.
            </p>
            <div className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-3 rounded-sm bg-[#151610] px-4 text-[9px] font-black uppercase tracking-[0.08em] text-[#f4f1e8]">
              Quero aproveitar agora <span className="text-base text-[#d8ff00]">→</span>
            </div>
            <small className="mt-2.5 block text-[7px] font-bold uppercase tracking-[0.1em] text-[#85887e]">
              Válido somente durante este atendimento.
            </small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .demo-wheel {
          animation: brindoleta-spin 9s cubic-bezier(0.12, 0.72, 0.16, 1) infinite;
          will-change: transform;
        }

        .demo-pointer {
          animation: brindoleta-pointer 180ms ease-in-out infinite alternate;
          transform-origin: 50% 0;
        }

        .demo-progress {
          animation: brindoleta-progress 9s linear infinite;
        }

        .demo-prize {
          animation: brindoleta-prize 9s ease-in-out infinite;
          pointer-events: none;
        }

        .demo-label {
          animation: brindoleta-labels 9s ease-in-out infinite;
        }

        @keyframes brindoleta-spin {
          0%, 5% { transform: rotate(0deg); }
          48% { transform: rotate(1260deg); }
          62%, 100% { transform: rotate(1440deg); }
        }

        @keyframes brindoleta-pointer {
          from { transform: rotate(-3deg); }
          to { transform: rotate(3deg); }
        }

        @keyframes brindoleta-progress {
          0% { transform: scaleX(0); opacity: 1; }
          62% { transform: scaleX(1); opacity: 1; }
          70%, 100% { transform: scaleX(1); opacity: 0.25; }
        }

        @keyframes brindoleta-prize {
          0%, 63% { opacity: 0; visibility: hidden; transform: scale(0.98); }
          68%, 94% { opacity: 1; visibility: visible; transform: scale(1); }
          100% { opacity: 0; visibility: hidden; transform: scale(0.98); }
        }

        @keyframes brindoleta-labels {
          0%, 7% { opacity: 1; }
          11%, 56% { opacity: 0; }
          63%, 100% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .demo-wheel, .demo-pointer, .demo-progress, .demo-prize, .demo-label { animation: none; }
          .demo-progress { transform: scaleX(1); }
          .demo-prize { display: none; }
        }
      `}</style>
    </div>
  )
}
