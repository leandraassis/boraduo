import type { RoleType } from '../lib/gameData'

export function RoleIcon({ role, className = 'h-5 w-5' }: { role: RoleType; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const

  switch (role) {
    case 'duelist':
      return (
        <svg {...common}>
          <path d="M4 20 20 4M14 4h6v6M10 20H4v-6" />
        </svg>
      )
    case 'sentinel':
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        </svg>
      )
    case 'controller':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
        </svg>
      )
    case 'initiator':
      return (
        <svg {...common}>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      )
  }
}
