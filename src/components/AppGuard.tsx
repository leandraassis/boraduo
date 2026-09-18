import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'

export function AppGuard({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading } = useProfile(session?.user.id)

  if (sessionLoading || (session && profileLoading)) {
    return null
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />
  }

  if (profile.status === 'banned') {
    return <Navigate to="/banned" replace />
  }

  return children
}
