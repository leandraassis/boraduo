import { useEffect, useRef } from 'react'
import { parseMessageRow, type ChatMessage } from '../lib/chat'
import { supabase } from '../lib/supabase'

// `in.(...)` aceita até 100 valores no filtro do Realtime.
const MAX_WATCHED_MATCHES = 100

interface ConversationsRealtimeHandlers {
  onMessage: (message: ChatMessage & { matchId: string }) => void
  // Match novo (a conversa ainda não está na lista): recarrega a lista.
  onNewMatch: () => void
  // Canal de mensagens (re)conectado: o que chegou antes/durante a queda não veio por evento.
  onSubscribed: () => void
}

// Mantém a lista de Matches viva: INSERT em `messages` das conversas listadas (prévia, ordem e "não
// lida" mudam sem abrir a conversa) e INSERT em `matches` do usuário (conversa nova aparece sozinha).
// A RLS continua decidindo o que cada conta recebe; o filtro só reduz o tráfego ao necessário.
export function useConversationsRealtime(
  userId: string | undefined,
  matchIds: string[],
  handlers: ConversationsRealtimeHandlers,
) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  // Chave estável (ordenada): reordenar a lista por mensagem nova não pode reabrir o canal.
  const watchedKey = [...matchIds].sort().slice(0, MAX_WATCHED_MATCHES).join(',')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const onNewMatch = () => {
      if (!cancelled) handlersRef.current.onNewMatch()
    }

    const channel = supabase
      .channel(`conversations-matches:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_a_id=eq.${userId}` },
        onNewMatch,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_b_id=eq.${userId}` },
        onNewMatch,
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!userId || !watchedKey) return
    let cancelled = false

    const channel = supabase
      .channel(`conversations-messages:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=in.(${watchedKey})` },
        (payload) => {
          const message = parseMessageRow(payload.new)
          if (message && !cancelled) handlersRef.current.onMessage(message)
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !cancelled) handlersRef.current.onSubscribed()
      })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId, watchedKey])
}
