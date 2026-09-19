import type { DeckFilters } from './deck'
import { HIGHEST_RANK, LOWEST_RANK } from './deck'
import type { RankType, RoleType } from './gameData'
import { supabase } from './supabase'

export const PRESENCE_TOPIC = 'available-now'
export const AVAILABLE_PAGE_SIZE = 20

export interface AvailableProfile {
  id: string
  username: string
  avatarUrl: string | null
  role: RoleType
  mainAgentId: string
  rank: RankType
  createdAt: string
}

export interface AvailableCursor {
  createdAt: string
  id: string
}

export function cursorOf(profile: AvailableProfile): AvailableCursor {
  return { createdAt: profile.createdAt, id: profile.id }
}

export function mergeAvailable(current: AvailableProfile[], incoming: AvailableProfile[]): AvailableProfile[] {
  const byId = new Map(current.map((p) => [p.id, p]))
  incoming.forEach((p) => byId.set(p.id, p))
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
}

// O banco só devolve quem, além de estar em `onlineIds`, tem is_available = true (cruzamento
// presença x banco); a presença sozinha nunca faz alguém aparecer.
export async function fetchAvailablePage(
  filters: DeckFilters,
  onlineIds: string[],
  cursor: AvailableCursor | null,
  limit: number = AVAILABLE_PAGE_SIZE,
): Promise<AvailableProfile[]> {
  if (onlineIds.length === 0) return []

  const { data, error } = await supabase.rpc('fn_get_available_now', {
    p_online_ids: onlineIds,
    p_roles: filters.roles.length > 0 ? filters.roles : undefined,
    p_min_rank: filters.minRank === LOWEST_RANK ? undefined : filters.minRank,
    p_max_rank: filters.maxRank === HIGHEST_RANK ? undefined : filters.maxRank,
    p_cursor_created_at: cursor?.createdAt,
    p_cursor_id: cursor?.id,
    p_limit: limit,
  })
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    role: row.role,
    mainAgentId: row.main_agent_id,
    rank: row.rank,
    createdAt: row.created_at,
  }))
}

export type QuickMatchFailure = 'unavailable' | 'other'

export class QuickMatchError extends Error {
  readonly reason: QuickMatchFailure

  constructor(reason: QuickMatchFailure) {
    super(reason)
    this.reason = reason
  }
}

// Toda a validação real (contas ativas, alvo disponível, sem bloqueio) fica na RPC; o client só traduz o erro.
export async function quickMatch(targetId: string, myId: string): Promise<string> {
  const { error } = await supabase.rpc('fn_create_quick_match', { p_target_id: targetId })
  if (error) {
    throw new QuickMatchError(error.message === 'target not available' ? 'unavailable' : 'other')
  }

  const { data, error: lookupError } = await supabase
    .from('matches')
    .select('id')
    .or(`and(user_a_id.eq.${myId},user_b_id.eq.${targetId}),and(user_a_id.eq.${targetId},user_b_id.eq.${myId})`)
    .maybeSingle()
  if (lookupError || !data) throw new QuickMatchError('other')
  return data.id
}
