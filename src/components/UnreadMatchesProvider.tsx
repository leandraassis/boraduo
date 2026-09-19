import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useMatch } from 'react-router-dom'
import { UnreadMatchesContext, type UnreadMatchesContextValue } from '../contexts/unreadMatches'
import { useSession } from '../hooks/useSession'
import { fetchUnreadMatchesCount, parseMessageRow } from '../lib/chat'
import { supabase } from '../lib/supabase'

// Badge da aba Matches: quantos matches têm mensagem não lida. Independe da central de notificações (mensagens
// não viram notificação). A fonte de verdade é o servidor (fn_get_unread_matches_count, baseada em match_reads):
// cada evento do Realtime só dispara uma nova contagem, nunca um +1 local, para não haver drift.
export function UnreadMatchesProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session?.user.id
  const { pathname } = useLocation()
  const openMatchId = useMatch('/app/matches/:matchId')?.params.matchId
  const [unreadMatchesCount, setUnreadMatchesCount] = useState(0)
  const latestRequest = useRef(0)
  const openMatchIdRef = useRef(openMatchId)

  useEffect(() => {
    openMatchIdRef.current = openMatchId
  })

  const refreshCount = useCallback(() => {
    const request = ++latestRequest.current
    return fetchUnreadMatchesCount()
      .then((count) => {
        if (request === latestRequest.current) setUnreadMatchesCount(count)
      })
      // Mantém a última contagem conhecida; a próxima navegação/foco/evento tenta de novo.
      .catch(() => undefined)
  }, [])

  // Rede de segurança para o que não chega por evento (ex.: o outro usuário me bloqueou).
  useEffect(() => {
    if (!userId) return
    void refreshCount()
  }, [userId, pathname, refreshCount])

  useEffect(() => {
    if (!userId) return
    const onFocus = () => {
      if (document.visibilityState === 'visible') void refreshCount()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [userId, refreshCount])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    let subscribedBefore = false

    function onChange() {
      if (!cancelled) void refreshCount()
    }

    // A RLS de `messages` já restringe o que chega às conversas do usuário; o filtro só tira as próprias mensagens.
    // `match_reads` (só as linhas do usuário) avisa quando uma conversa é lida, aqui ou em outra aba.
    const readsFilter = `user_id=eq.${userId}`
    const channel = supabase
      .channel(`unread-matches:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=neq.${userId}` },
        (payload) => {
          const message = parseMessageRow(payload.new)
          // Conversa aberta aqui: o ChatView já a marca como lida e o evento de match_reads recontará.
          // Recontar agora faria o badge piscar a cada mensagem recebida.
          if (message && message.matchId === openMatchIdRef.current) return
          onChange()
        },
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_reads', filter: readsFilter }, onChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_reads', filter: readsFilter }, onChange)
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
  }, [userId, refreshCount])

  const value = useMemo<UnreadMatchesContextValue>(() => ({ unreadMatchesCount }), [unreadMatchesCount])

  return <UnreadMatchesContext.Provider value={value}>{children}</UnreadMatchesContext.Provider>
}
