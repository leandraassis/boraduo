import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { NotificationsContext, type NotificationsContextValue } from '../contexts/notifications'
import { useSession } from '../hooks/useSession'
import { fetchUnreadCount } from '../lib/notifications'

// Contagem de não lidas para o badge da bottom nav. Sem Realtime (Fase 7.2): recarrega ao montar o
// shell, a cada navegação e quando a aba volta a ficar em foco.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session?.user.id
  const { pathname } = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
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

  const value = useMemo<NotificationsContextValue>(
    () => ({ unreadCount, refreshUnreadCount, adjustUnreadCount }),
    [unreadCount, refreshUnreadCount, adjustUnreadCount],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
