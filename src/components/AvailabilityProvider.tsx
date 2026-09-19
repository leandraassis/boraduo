import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { AvailabilityContext, type AvailabilityContextValue } from '../contexts/availability'
import { useSession } from '../hooks/useSession'
import { hasSeenAvailabilityWarning, markAvailabilityWarningSeen } from '../lib/availabilityWarning'
import { PRESENCE_TOPIC } from '../lib/availableNow'
import { supabase } from '../lib/supabase'
import { AvailabilityWarningModal } from './AvailabilityWarningModal'

const PRESENCE_READY_FALLBACK_MS = 2500
// Ao entrar no canal o primeiro presence_state pode vir vazio e os presentes chegam num presence_diff
// logo depois; sem essa janela a lista mostraria "ninguém disponível" antes de popular.
const PRESENCE_SETTLE_MS = 1200

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session?.user.id

  const [isAvailable, setIsAvailable] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  const [presenceStatus, setPresenceStatus] = useState<'connecting' | 'ready' | 'error'>('connecting')
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string>>(() => new Set())
  const [subscribed, setSubscribed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isAvailableRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('is_available')
      .eq('id', userId)
      .single()
      .then(({ data, error: loadError }) => {
        if (cancelled) return
        if (loadError || !data) {
          setLoadFailed(true)
          return
        }
        setLoadFailed(false)
        setIsAvailable(data.is_available)
        setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [userId, loadAttempt])

  // Canal privado (RLS em realtime.messages exige conta ativa). Todo usuário logado entra para
  // poder ver quem está presente; só quem tem is_available = true dá track().
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined
    let settleTimer: ReturnType<typeof setTimeout> | undefined

    const channel = supabase.channel(PRESENCE_TOPIC, {
      config: { private: true, presence: { key: userId } },
    })
    channelRef.current = channel

    channel.on('presence', { event: 'sync' }, () => {
      if (cancelled) return
      const ids = Object.keys(channel.presenceState())
      setOnlineIds(new Set(ids))
      if (ids.length > 0) {
        clearTimeout(settleTimer)
        setPresenceStatus('ready')
      } else if (!settleTimer) {
        settleTimer = setTimeout(() => {
          if (!cancelled) setPresenceStatus((s) => (s === 'connecting' ? 'ready' : s))
        }, PRESENCE_SETTLE_MS)
      }
    })

    channel.subscribe((status) => {
      if (cancelled) return
      if (status === 'SUBSCRIBED') {
        setSubscribed(true)
        if (isAvailableRef.current) {
          void channel.track({ user_id: userId, online_at: new Date().toISOString() })
        }
        fallbackTimer = setTimeout(() => {
          if (!cancelled) setPresenceStatus((s) => (s === 'connecting' ? 'ready' : s))
        }, PRESENCE_READY_FALLBACK_MS)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSubscribed(false)
        setPresenceStatus('error')
      } else if (status === 'CLOSED') {
        setSubscribed(false)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      clearTimeout(settleTimer)
      if (channelRef.current === channel) channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [userId, attempt])

  useEffect(() => {
    isAvailableRef.current = isAvailable
    const channel = channelRef.current
    if (!channel || !subscribed || !userId) return
    if (isAvailable) {
      void channel.track({ user_id: userId, online_at: new Date().toISOString() })
    } else {
      void channel.untrack()
    }
  }, [isAvailable, subscribed, userId])

  const persist = useCallback(
    async (next: boolean) => {
      if (!userId) return
      setSaving(true)
      setError(null)
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ is_available: next })
        .eq('id', userId)
        .select('is_available')
        .single()
      setSaving(false)

      if (updateError) {
        setError('Não foi possível atualizar sua disponibilidade. Tente novamente.')
        return
      }
      setIsAvailable(data.is_available)
    },
    [userId],
  )

  const requestToggle = useCallback(() => {
    if (saving || !loaded) return
    if (!isAvailable && !hasSeenAvailabilityWarning()) {
      setShowWarning(true)
      return
    }
    void persist(!isAvailable)
  }, [saving, loaded, isAvailable, persist])

  const retryLoad = useCallback(() => {
    setLoadFailed(false)
    setLoadAttempt((n) => n + 1)
  }, [])

  const retryPresence = useCallback(() => {
    setPresenceStatus('connecting')
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<AvailabilityContextValue>(
    () => ({
      isAvailable,
      loaded,
      loadFailed,
      retryLoad,
      saving,
      error,
      requestToggle,
      presence: { status: presenceStatus, onlineIds, retry: retryPresence },
    }),
    [isAvailable, loaded, loadFailed, retryLoad, saving, error, requestToggle, presenceStatus, onlineIds, retryPresence],
  )

  return (
    <AvailabilityContext.Provider value={value}>
      {children}
      {showWarning && (
        <AvailabilityWarningModal
          onConfirm={() => {
            markAvailabilityWarningSeen()
            setShowWarning(false)
            void persist(true)
          }}
          onCancel={() => setShowWarning(false)}
        />
      )}
    </AvailabilityContext.Provider>
  )
}
