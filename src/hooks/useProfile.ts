import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export function useProfile(userId: string | undefined) {
  const [trackedUserId, setTrackedUserId] = useState(userId)
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const [loading, setLoading] = useState(!!userId)

  if (trackedUserId !== userId) {
    setTrackedUserId(userId)
    setProfile(null)
    setLoading(!!userId)
  }

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { profile, loading, setProfile }
}
