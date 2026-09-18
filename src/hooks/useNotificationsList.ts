import { useCallback, useEffect, useState } from 'react'
import { useNotifications } from '../contexts/notifications'
import { fetchNotifications, type AppNotification } from '../lib/notifications'

interface ListState {
  reload: number
  status: 'loading' | 'ready' | 'error'
  items: AppNotification[]
}

export function useNotificationsList() {
  const { changeVersion } = useNotifications()
  const [reload, setReload] = useState(0)
  const [state, setState] = useState<ListState>({ reload: 0, status: 'loading', items: [] })

  if (state.reload !== reload) {
    setState({ reload, status: 'loading', items: [] })
  }

  // Carrega ao abrir a tela e recarrega em silêncio quando a aba volta ao foco (sem Realtime).
  useEffect(() => {
    let cancelled = false
    let inFlight = false

    function load(silent: boolean) {
      if (inFlight) return
      inFlight = true
      fetchNotifications()
        .then((items) => {
          if (!cancelled) setState((s) => (s.reload === reload ? { ...s, status: 'ready', items } : s))
        })
        .catch(() => {
          if (!cancelled && !silent) setState((s) => (s.reload === reload ? { ...s, status: 'error' } : s))
        })
        .finally(() => {
          inFlight = false
        })
    }

    load(false)
    const onFocus = () => {
      if (document.visibilityState === 'visible') load(true)
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [reload])

  // Notificação nova (ou lida em outra aba) chegou por Realtime: atualiza a lista aberta em silêncio.
  useEffect(() => {
    if (changeVersion === 0) return
    let cancelled = false
    fetchNotifications()
      .then((items) => {
        if (!cancelled) setState((s) => ({ ...s, status: 'ready', items }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [changeVersion])

  const retry = useCallback(() => setReload((n) => n + 1), [])

  const markReadLocally = useCallback((id: string) => {
    setState((s) => ({ ...s, items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  }, [])

  return { status: state.status, items: state.items, retry, markReadLocally }
}
