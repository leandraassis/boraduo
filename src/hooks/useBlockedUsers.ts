import { useCallback, useEffect, useState } from 'react'
import { fetchBlockedUsers, type BlockedUser } from '../lib/moderation'

interface BlockedState {
  status: 'loading' | 'ready' | 'error'
  items: BlockedUser[]
}

export function useBlockedUsers() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<BlockedState>({ status: 'loading', items: [] })

  useEffect(() => {
    let cancelled = false
    fetchBlockedUsers()
      .then((items) => {
        if (!cancelled) setState({ status: 'ready', items })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }))
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    setAttempt((n) => n + 1)
  }, [])

  const removeLocally = useCallback((blockId: string) => {
    setState((s) => ({ ...s, items: s.items.filter((b) => b.blockId !== blockId) }))
  }, [])

  return { status: state.status, items: state.items, retry, removeLocally }
}
