import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationsContext, type NotificationsContextValue } from '../contexts/notifications'
import { useSession } from '../hooks/useSession'
import { fetchUnreadCount } from '../lib/notifications'
import { supabase } from '../lib/supabase'

// Contagem de não lidas para o badge da bottom nav. Realtime em `notifications` (filtrado por user_id,
// RLS incluída) mantém o badge vivo; recarregar ao montar, navegar e voltar ao foco continua como rede
// de segurança para eventos perdidos.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session?.user.id
  const { pathname } = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [changeVersion, setChangeVersion] = useState(0)
  const latestRequest = useRef(0)

  const refreshUnreadCount = useCallback(() => {
    const request = ++latestRequest.current
    return fetchUnreadCount()
      .then((count) => {
        if (request === latestRequest.current) setUnreadCount(count)
      })
      // Mantém a última contagem conhecida; a próxima navegação/foco tenta de novo.
      .catch(() => undefined)
  }, [])

  const adjustUnreadCount = useCallback((delta: number) => {
    // Invalida respostas em voo que já nasceram desatualizadas.
    latestRequest.current++
    setUnreadCount((count) => Math.max(0, count + delta))
  }, [])

  useEffect(() => {
    if (!userId) return
    void refreshUnreadCount()
  }, [userId, pathname, refreshUnreadCount])

  useEffect(() => {
    if (!userId) return
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refreshUnreadCount()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [userId, refreshUnreadCount])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let subscribedBefore = false

    // Reconta no servidor em vez de somar +1: o count é a fonte da verdade e evita drift.
    function onChange() {
      if (cancelled) return
      setChangeVersion((v) => v + 1)
      void refreshUnreadCount()
    }

    const filter = `user_id=eq.${userId}`
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter }, onChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter }, onChange)
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || cancelled) return
        // Ao reconectar, o que chegou durante a queda não veio por evento.
        if (subscribedBefore) onChange()
        subscribedBefore = true
      })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId, refreshUnreadCount])

  const value = useMemo<NotificationsContextValue>(
    () => ({ unreadCount, changeVersion, refreshUnreadCount, adjustUnreadCount }),
    [unreadCount, changeVersion, refreshUnreadCount, adjustUnreadCount],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
