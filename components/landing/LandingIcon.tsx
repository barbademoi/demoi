export type LandingIconName =
  | 'target'
  | 'team'
  | 'spark'
  | 'chart'
  | 'qr'
  | 'gift'
  | 'check'
  | 'phone'
  | 'shield'

type Props = {
  name: LandingIconName
  className?: string
}

export default function LandingIcon({ name, className = 'h-5 w-5' }: Props) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3.5V1.8M20.5 12h1.7M12 20.5v1.7M3.5 12H1.8" />
        <circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (name === 'team') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.7 19c.4-3.3 2.2-5 5.3-5s4.9 1.7 5.3 5" />
        <path d="M15.5 5.7a2.8 2.8 0 0 1 0 5.4M16 14c2.7.3 4.1 2 4.4 5" />
      </svg>
    )
  }

  if (name === 'spark') {
    return (
      <svg {...common}>
        <path d="m13.2 2-1 6.1a2 2 0 0 1-1.7 1.7l-6.1 1 6.1 1a2 2 0 0 1 1.7 1.7l1 6.1 1-6.1a2 2 0 0 1 1.7-1.7l6.1-1-6.1-1a2 2 0 0 1-1.7-1.7L13.2 2Z" />
        <path d="m5.2 3-.3 1.6-1.6.3 1.6.3.3 1.6.3-1.6 1.6-.3-1.6-.3L5.2 3Z" />
      </svg>
    )
  }

  if (name === 'chart') {
    return (
      <svg {...common}>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
        <path d="M15.5 7H19v3.5" />
      </svg>
    )
  }

  if (name === 'qr') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="15" width="6" height="6" rx="1" />
        <path d="M15 15h2v2h-2zM19 15h2M19 19h2v2M15 19v2" />
      </svg>
    )
  }

  if (name === 'gift') {
    return (
      <svg {...common}>
        <path d="M3 9h18v4H3zM5 13h14v8H5zM12 9v12" />
        <path d="M12 9H8.3A2.3 2.3 0 1 1 10 5.2L12 9Zm0 0h3.7A2.3 2.3 0 1 0 14 5.2L12 9Z" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.2 2.6 2.6L16.5 9" />
      </svg>
    )
  }

  if (name === 'phone') {
    return (
      <svg {...common}>
        <rect x="6.5" y="2" width="11" height="20" rx="2.5" />
        <path d="M10 5h4M11 18.8h2" />
      </svg>
    )
  }

  if (name === 'shield') {
    return (
      <svg {...common}>
        <path d="M12 2.5 20 6v5.3c0 5.1-3.1 8.5-8 10.2-4.9-1.7-8-5.1-8-10.2V6l8-3.5Z" />
        <path d="m8.6 12 2.2 2.2 4.8-4.8" />
      </svg>
    )
  }

  return null
}
