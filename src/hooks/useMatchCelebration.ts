import { useCallback, useEffect, useState } from 'react'
import type { RankType, RoleType } from '../lib/gameData'
import { supabase } from '../lib/supabase'

export interface CelebratedMatch {
  matchId: string
  other: { id: string; username: string; avatarUrl: string | null; role: RoleType; rank: RankType }
}

interface MatchRow {
  id: string
  user_a_id: string
  user_b_id: string
  origin: string
}

function isMatchRow(row: unknown): row is MatchRow {
  if (typeof row !== 'object' || row === null) return false
  const r = row as Record<string, unknown>
  return typeof r.id === 'string' && typeof r.user_a_id === 'string' && typeof r.user_b_id === 'string'
}

// Detecta em tempo real matches criados enquanto a tela de swipe está aberta. `postgres_changes` não
// aceita filtro OR entre colunas, então há um binding por coluna (user_a_id e user_b_id) no mesmo canal
// e os eventos se juntam aqui. Quem não estava na tela não recebe nada retroativo: só a notificação.
export function useMatchCelebration(userId: string | undefined) {
  const [queue, setQueue] = useState<CelebratedMatch[]>([])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const seen = new Set<string>()

    async function handle(row: unknown) {
      if (!isMatchRow(row) || seen.has(row.id)) return
      // Quick match é "chat iniciado" (toast sóbrio para quem chamou), não celebração.
      if (row.origin !== 'swipe') return
      seen.add(row.id)

      const otherId = row.user_a_id === userId ? row.user_b_id : row.user_a_id
      // Falha de rede aqui perderia o modal sem aviso: tenta de novo antes de desistir (a notificação persiste).
      let data = null
      for (let attempt = 0; attempt < 3 && !data && !cancelled; attempt++) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        const result = await supabase
          .from('profiles')
          .select('id, username, avatar_url, role, rank')
          .eq('id', otherId)
          .maybeSingle()
        data = result.data
      }
      if (cancelled || !data) return

      setQueue((q) => [
        ...q,
        {
          matchId: row.id,
          other: { id: data.id, username: data.username, avatarUrl: data.avatar_url, role: data.role, rank: data.rank },
        },
      ])
    }

    const channel = supabase
      .channel(`match-celebration:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_a_id=eq.${userId}` },
        (payload) => void handle(payload.new),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_b_id=eq.${userId}` },
        (payload) => void handle(payload.new),
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), [])

  return { current: queue[0] ?? null, dismiss }
}
