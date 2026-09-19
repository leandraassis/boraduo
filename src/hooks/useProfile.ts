import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export function useProfile(userId: string | undefined) {
  const [trackedUserId, setTrackedUserId] = useState(userId)
  const [attempt, setAttempt] = useState(0)
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const [loading, setLoading] = useState(!!userId)
  // Falha de rede é diferente de "perfil não existe": quem consome não pode tratar as duas do mesmo jeito
  // (senão uma queda de conexão mandaria um usuário já cadastrado de volta ao onboarding).
  const [error, setError] = useState(false)

  if (trackedUserId !== userId) {
    setTrackedUserId(userId)
    setProfile(null)
    setLoading(!!userId)
    setError(false)
  }

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(true)
        } else {
          setError(false)
          setProfile(data)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const retry = useCallback(() => {
    setError(false)
    setLoading(true)
    setAttempt((n) => n + 1)
  }, [])

  return { profile, loading, error, setProfile, retry }
}
