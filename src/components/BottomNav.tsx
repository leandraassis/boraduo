import type { ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { AvailabilityDot } from './AvailabilityDot'
import { focusRing } from './formStyles'
import { BellIcon, ChatIcon, CompassIcon, UserIcon } from './icons'

// Fase 7: trocar por a contagem real de notificações não lidas.
const UNREAD_NOTIFICATIONS = 0

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-bold text-ink ring-2 ring-canvas">
      <span className="sr-only">{count} não lidas</span>
      <span aria-hidden="true">{count > 9 ? '9+' : count}</span>
    </span>
  )
}

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  // Espaço reservado no canto do ícone (badge de não lidas, ponto de disponibilidade).
  adornment?: ReactNode
}

const ITEMS: NavItem[] = [
  { to: '/app/discover', label: 'Descobrir', icon: CompassIcon },
  { to: '/app/matches', label: 'Matches', icon: ChatIcon },
  {
    to: '/app/notifications',
    label: 'Notificações',
    icon: BellIcon,
    adornment: <UnreadBadge count={UNREAD_NOTIFICATIONS} />,
  },
  { to: '/app/profile', label: 'Perfil', icon: UserIcon, adornment: <AvailabilityDot /> },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px]"
    >
      <ul className="mx-auto flex h-16 w-full max-w-[480px]">
        {ITEMS.map(({ to, label, icon: Icon, adornment }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `relative flex h-full flex-col items-center justify-center gap-1 text-[11px] leading-3 font-medium tracking-[0.02em] transition ${focusRing} ${
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-brand shadow-glow-brand"
                    />
                  )}
                  <span className="relative">
                    <Icon className={`h-6 w-6 transition ${isActive ? 'text-brand-soft' : ''}`} />
                    {adornment}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
