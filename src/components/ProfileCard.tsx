import { useState } from 'react'
import { RANK_INFO, ROLE_INFO } from '../lib/gameData'
import type { Tables } from '../types/database'
import { RoleIcon } from './RoleIcon'

export type ProfileCardData = Pick<
  Tables<'profiles'>,
  'username' | 'avatar_url' | 'role' | 'rank' | 'main_agent' | 'bio'
>

const chipClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-canvas/70 px-2.5 py-1 text-xs font-medium tracking-[0.02em] backdrop-blur'

interface ProfileCardProps {
  profile: ProfileCardData
  className?: string
  fill?: boolean
}

export function ProfileCard({ profile, className = '', fill = false }: ProfileCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  const rank = RANK_INFO[profile.rank]
  const role = ROLE_INFO[profile.role]
  const showImage = profile.avatar_url !== null && profile.avatar_url !== failedUrl
  const initial = Array.from(profile.username.trim())[0]?.toUpperCase() ?? '?'
  const mainAgent = profile.main_agent.trim()

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-line bg-surface ${fill ? 'h-full' : ''} ${className}`}
      aria-label={`Perfil de ${profile.username}`}
    >
      <div className={`relative w-full ${fill ? 'h-full' : 'aspect-[4/5]'}`}>
        {showImage ? (
          <img
            src={profile.avatar_url ?? undefined}
            alt={`Avatar de ${profile.username}`}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            onError={() => setFailedUrl(profile.avatar_url)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-brand/40 via-surface to-canvas">
            <span className="text-7xl font-bold text-ink/80" aria-hidden="true">
              {initial}
            </span>
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 15, 20, 0) 40%, rgba(15, 15, 20, 0.95) 90%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
          <h2 className="truncate text-2xl leading-8 font-bold tracking-[-0.02em] text-ink">{profile.username}</h2>

          <div className="flex flex-wrap gap-2">
            <span className={`${chipClass} text-ink`}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: rank.color }}
                aria-hidden="true"
              />
              {rank.label}
            </span>
            <span className={`${chipClass} text-match`}>
              <RoleIcon role={profile.role} className="h-3.5 w-3.5" />
              {role.label}
            </span>
            {mainAgent && (
              <span className={`${chipClass} max-w-full text-ink-muted`}>
                <span className="truncate">{mainAgent}</span>
              </span>
            )}
          </div>

          {profile.bio && <p className="text-sm leading-5 wrap-break-word text-ink-muted">{profile.bio}</p>}
        </div>
      </div>
    </article>
  )
}
