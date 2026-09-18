import type { AvailableProfile } from '../../lib/availableNow'
import { RANK_INFO, ROLE_INFO } from '../../lib/gameData'
import { Avatar } from '../Avatar'
import { focusRing } from '../formStyles'
import { RoleIcon } from '../RoleIcon'

interface AvailableItemProps {
  profile: AvailableProfile
  calling: boolean
  disabled: boolean
  onCall: (profile: AvailableProfile) => void
}

export function AvailableItem({ profile, calling, disabled, onCall }: AvailableItemProps) {
  const rank = RANK_INFO[profile.rank]

  return (
    <li
      data-testid="available-item"
      className="relative flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition hover:border-line-strong"
    >
      <div className="relative shrink-0">
        <Avatar url={profile.avatarUrl} name={profile.username} className="h-12 w-12" />
        <span
          className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface bg-ready"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 font-semibold text-ink">{profile.username}</p>
        <p className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1 text-match">
            <RoleIcon role={profile.role} className="h-3.5 w-3.5" />
            {ROLE_INFO[profile.role].label}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rank.color }} aria-hidden="true" />
            {rank.label}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onCall(profile)}
        disabled={disabled}
        aria-label={`Chamar ${profile.username}`}
        className={`shrink-0 cursor-pointer rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink shadow-glow-brand transition after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:brightness-110 ${focusRing} disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100`}
      >
        {calling ? 'Chamando...' : 'Chamar'}
      </button>
    </li>
  )
}
