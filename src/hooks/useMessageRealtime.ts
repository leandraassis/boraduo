import { useEffect, useRef } from 'react'
import { parseMessageRow, type ChatMessage } from '../lib/chat'
import { supabase } from '../lib/supabase'

interface MessageRealtimeHandlers {
  onInsert: (message: ChatMessage) => void
  // Canal (re)conectado: o que chegou antes/durante a queda não veio por evento, então quem chama
  // reconcilia com uma busca.
  onSubscribed: () => void
}

// INSERT em `messages` filtrado por match_id. A RLS de messages ("select messages of own match") é
// aplicada pelo Realtime com o JWT do usuário: quem não é do match nunca recebe o evento.
// O cleanup remove o canal ao sair da conversa (ou trocar de match), sem acumular assinaturas.
export function useMessageRealtime(matchId: string, handlers: MessageRealtimeHandlers) {
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    let cancelled = false

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = parseMessageRow(payload.new)
          if (row && !cancelled) {
            handlersRef.current.onInsert({ id: row.id, senderId: row.senderId, content: row.content, createdAt: row.createdAt })
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !cancelled) handlersRef.current.onSubscribed()
      })

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [matchId])
}
