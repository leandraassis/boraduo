import type { ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../contexts/notifications'
import { useUnreadMatches } from '../contexts/unreadMatches'
import { AvailabilityDot } from './AvailabilityDot'
import { focusRing } from './formStyles'
import { BellIcon, ChatIcon, CompassIcon, UserIcon } from './icons'
import { Logo } from './Logo'

function UnreadBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-bold text-ink ring-2 ring-canvas">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{count > 9 ? '9+' : count}</span>
    </span>
  )
}

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const ITEMS: NavItem[] = [
  { to: '/app/discover', label: 'Descobrir', icon: CompassIcon },
  { to: '/app/matches', label: 'Matches', icon: ChatIcon },
  { to: '/app/notifications', label: 'Notificações', icon: BellIcon },
  { to: '/app/profile', label: 'Perfil', icon: UserIcon },
]

// Um único componente, dois layouts (spec 6.7): barra inferior abaixo de 1024px (mobile e tablet) e barra
// lateral fixa à esquerda em telas largas. Mesmos destinos, mesmo badge e mesmo ponto de disponibilidade.
export function AppNav() {
  const { unreadCount } = useNotifications()
  const { unreadMatchesCount } = useUnreadMatches()

  // Canto do ícone: badge de conversas com mensagem não lida em Matches, de notificações não lidas em
  // Notificações e ponto de disponibilidade em Perfil.
  const adornments: Record<string, ReactNode> = {
    '/app/matches': (
      <UnreadBadge
        count={unreadMatchesCount}
        label={unreadMatchesCount === 1 ? '1 conversa com mensagem não lida' : `${unreadMatchesCount} conversas com mensagens não lidas`}
      />
    ),
    '/app/notifications': (
      <UnreadBadge count={unreadCount} label={unreadCount === 1 ? '1 não lida' : `${unreadCount} não lidas`} />
    ),
    '/app/profile': <AvailabilityDot />,
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-[20px] lg:inset-y-0 lg:right-auto lg:left-0 lg:w-(--app-nav-w) lg:border-t-0 lg:border-r lg:pb-0"
    >
      <div className="hidden px-6 pt-7 pb-8 lg:block">
        <Logo className="h-9 w-auto" />
      </div>

      <ul className="mx-auto flex h-16 w-full max-w-[480px] lg:mx-0 lg:h-auto lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1 lg:flex-none">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `relative flex h-full flex-col items-center justify-center gap-1 text-[11px] leading-3 font-medium tracking-[0.02em] transition lg:h-auto lg:flex-row lg:justify-start lg:gap-3.5 lg:rounded-xl lg:px-3.5 lg:py-3 lg:text-sm lg:leading-5 lg:tracking-normal ${focusRing} ${
                  isActive ? 'text-ink lg:bg-brand/10' : 'text-ink-muted hover:text-ink lg:hover:bg-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-brand shadow-glow-brand lg:top-1/2 lg:left-0 lg:h-6 lg:w-1 lg:-translate-y-1/2"
                    />
                  )}
                  <span className="relative">
                    <Icon className={`h-6 w-6 transition ${isActive ? 'text-brand-soft' : ''}`} />
                    {adornments[to]}
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
