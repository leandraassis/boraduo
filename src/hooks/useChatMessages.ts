import { useCallback, useEffect, useState } from 'react'
import { fetchMessages, type ChatMessage } from '../lib/chat'

interface MessagesState {
  status: 'loading' | 'ready' | 'error'
  messages: ChatMessage[]
  truncated: boolean
}

export function useChatMessages(matchId: string) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<MessagesState>({ status: 'loading', messages: [], truncated: false })

  useEffect(() => {
    let cancelled = false
    fetchMessages(matchId)
      .then(({ messages, truncated }) => {
        if (!cancelled) setState({ status: 'ready', messages, truncated })
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, status: 'error' }))
      })
    return () => {
      cancelled = true
    }
  }, [matchId, attempt])

  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }))
    setAttempt((n) => n + 1)
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setState((s) => ({ ...s, messages: [...s.messages, message] }))
  }, [])

  const replaceMessage = useCallback((id: string, message: ChatMessage) => {
    setState((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? message : m)) }))
  }, [])

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setState((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }, [])

  return {
    status: state.status,
    messages: state.messages,
    truncated: state.truncated,
    retry,
    addMessage,
    replaceMessage,
    patchMessage,
  }
}
