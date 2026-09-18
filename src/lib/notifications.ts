import { supabase } from './supabase'

export interface AppNotification {
  id: string
  type: 'match'
  read: boolean
  createdAt: string
  // Para type = match: o outro usuário e o chat correspondente (null se o match não existir mais).
  other: { id: string; username: string; avatarUrl: string | null } | null
  matchId: string | null
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('fn_get_notifications')
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
    other:
      row.other_id && row.other_username
        ? { id: row.other_id, username: row.other_username, avatarUrl: row.other_avatar_url }
        : null,
    matchId: row.match_id,
  }))
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

// A RLS limita o update às notificações do próprio usuário e o grant de coluna, ao campo `read`.
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}
