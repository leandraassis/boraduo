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

  // Se a mensagem já chegou por Realtime/recarga antes de o envio resolver, só descarta a pendente.
  const replaceMessage = useCallback((id: string, message: ChatMessage) => {
    setState((s) => ({
      ...s,
      messages: s.messages.some((m) => m.id === message.id)
        ? s.messages.filter((m) => m.id !== id)
        : s.messages.map((m) => (m.id === id ? message : m)),
    }))
  }, [])

  // Mensagem vinda do Realtime; ignora se o id já está na conversa.
  const receiveMessage = useCallback((message: ChatMessage) => {
    setState((s) => (s.messages.some((m) => m.id === message.id) ? s : { ...s, messages: [...s.messages, message] }))
  }, [])

  // Reconcilia com o banco sem piscar skeleton, mantendo as mensagens ainda enviando/falhas.
  const reloadSilently = useCallback(() => {
    fetchMessages(matchId)
      .then(({ messages, truncated }) => {
        setState((s) => ({
          status: 'ready',
          truncated,
          messages: [...messages, ...s.messages.filter((m) => m.status !== undefined)],
        }))
      })
      .catch(() => undefined)
  }, [matchId])

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setState((s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
  }, [])

  return {
    status: state.status,
    messages: state.messages,
    truncated: state.truncated,
    retry,
    addMessage,
    receiveMessage,
    reloadSilently,
    replaceMessage,
    patchMessage,
  }
}
