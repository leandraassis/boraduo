import { useCallback, useEffect, useState } from 'react'
import { fetchConversations, sortConversations, type Conversation } from '../lib/chat'

interface ConversationsState {
  status: 'loading' | 'ready' | 'error'
  conversations: Conversation[]
}

export function useConversations() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ConversationsState>({ status: 'loading', conversations: [] })

  useEffect(() => {
    let cancelled = false
    fetchConversations()
      .then((conversations) => {
        if (!cancelled) setState({ status: 'ready', conversations })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }))
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    setAttempt((n) => n + 1)
  }, [])

  const patchConversation = useCallback((matchId: string, patch: Partial<Conversation>) => {
    setState((s) => ({
      ...s,
      conversations: sortConversations(s.conversations.map((c) => (c.matchId === matchId ? { ...c, ...patch } : c))),
    }))
  }, [])

  return { status: state.status, conversations: state.conversations, reload, patchConversation }
}
