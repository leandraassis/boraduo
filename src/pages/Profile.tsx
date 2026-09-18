import type { ReactNode } from 'react'
import { ProfileWorkspace } from '../components/profile/ProfileWorkspace'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'

function ProfileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas font-inter text-ink">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-6 pb-12 md:max-w-[840px] lg:max-w-[1180px]">
        {children}
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <ProfileShell>
      <div className="animate-pulse" aria-busy="true" aria-label="Carregando perfil">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <div className="h-8 w-40 rounded-lg bg-surface" />
            <div className="mt-2 h-4 w-64 rounded bg-surface" />
          </div>
          <div className="mt-5 h-20 rounded-2xl bg-surface lg:mt-0 lg:w-[460px] lg:shrink-0" />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[340px_minmax(0,1fr)] md:items-start">
          <div className="aspect-[4/5] rounded-2xl bg-surface" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-48 rounded-2xl bg-surface" />
            <div className="h-48 rounded-2xl bg-surface" />
          </div>
        </div>
      </div>
    </ProfileShell>
  )
}

export function Profile() {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading, setProfile } = useProfile(session?.user.id)

  if (sessionLoading || profileLoading) {
    return <ProfileSkeleton />
  }

  if (!profile) {
    return (
      <ProfileShell>
        <div className="py-16 text-center">
          <p className="text-sm text-ink-muted">Não foi possível carregar seu perfil.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-brand"
          >
            Tentar novamente
          </button>
        </div>
      </ProfileShell>
    )
  }

  return <ProfileWorkspace profile={profile} onProfileChange={setProfile} />
}
