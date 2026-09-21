import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { TERMS_VERSION } from '../lib/legal'
import { supabase } from '../lib/supabase'
import { TermsGate } from './legal/TermsGate'
import { ScreenError, ScreenSkeleton } from './ScreenStates'

export function AppGuard({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession()
  const userId = session?.user.id
  const { profile, loading: profileLoading, error: profileError, retry, setProfile } = useProfile(userId)
  const { pathname } = useLocation()
  const [bannedMidSession, setBannedMidSession] = useState(false)

  // O guard fica montado durante toda a navegação em /app/*; sem isto um banimento aplicado com o app
  // aberto só seria percebido no reload. Reconfere o status a cada navegação e ao voltar ao foco.
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    function check() {
      supabase
        .from('profiles')
        .select('status')
        .eq('id', userId!)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data?.status === 'banned') setBannedMidSession(true)
        })
    }
    function onFocus() {
      if (document.visibilityState === 'visible') check()
    }

    check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [userId, pathname])

  if (sessionLoading || (session && profileLoading)) {
    return <ScreenSkeleton />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profileError) {
    return <ScreenError title="Não foi possível carregar sua conta" onRetry={retry} />
  }

  if (!profile) {
    return <Navigate to="/onboarding" replace />
  }

  if (profile.status === 'banned' || bannedMidSession) {
    return <Navigate to="/banned" replace />
  }

  if (profile.terms_version !== TERMS_VERSION) {
    return <TermsGate profile={profile} onAccepted={setProfile} />
  }

  return children
}
