'use client'

import { usePathname } from 'next/navigation'

const PASSOS = [
  { num: 1, label: 'Identidade' },
  { num: 2, label: 'Operação' },
  { num: 3, label: 'Equipe' },
]

export default function OnboardingProgress() {
  const pathname = usePathname()
  const atual = pathname.includes('passo-3') ? 3 : pathname.includes('passo-2') ? 2 : 1

  return (
    <div className="w-full max-w-sm mx-auto mb-8">
      <div className="flex items-center justify-between">
        {PASSOS.map((passo, i) => (
          <div key={passo.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-sans transition-all',
                  atual > passo.num
                    ? 'bg-primary text-white'
                    : atual === passo.num
                      ? 'bg-primary text-white ring-2 ring-primary/30'
                      : 'bg-surface-2 text-text-muted border border-border',
                ].join(' ')}
              >
                {atual > passo.num ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : passo.num}
              </div>
              <span className={[
                'mt-1.5 text-xs font-sans whitespace-nowrap',
                atual === passo.num ? 'text-text' : 'text-text-muted',
              ].join(' ')}>
                {passo.label}
              </span>
            </div>
            {i < PASSOS.length - 1 && (
              <div className={[
                'flex-1 h-px mx-3 mb-4 transition-all',
                atual > passo.num ? 'bg-primary' : 'bg-border',
              ].join(' ')} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
