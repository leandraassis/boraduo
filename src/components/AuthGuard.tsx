import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { ScreenSkeleton } from './ScreenStates'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading) {
    return <ScreenSkeleton />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}
