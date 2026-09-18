import { RANK_VALUES, type RankType, type RoleType } from './gameData'
import { supabase } from './supabase'
import type { Database } from '../types/database'

export type DeckCard = Database['public']['Functions']['fn_get_swipe_deck']['Returns'][number]
export type SwipeDirection = 'like' | 'pass'

export interface DeckFilters {
  roles: RoleType[]
  minRank: RankType
  maxRank: RankType
  useMySchedule: boolean
}

export const LOWEST_RANK = RANK_VALUES[0]
export const HIGHEST_RANK = RANK_VALUES[RANK_VALUES.length - 1]

export const DEFAULT_FILTERS: DeckFilters = {
  roles: [],
  minRank: LOWEST_RANK,
  maxRank: HIGHEST_RANK,
  useMySchedule: false,
}

export const DECK_BATCH_SIZE = 10
export const DECK_PREFETCH_THRESHOLD = 3

export function isDefaultFilters(filters: DeckFilters): boolean {
  return (
    filters.roles.length === 0 &&
    filters.minRank === LOWEST_RANK &&
    filters.maxRank === HIGHEST_RANK &&
    !filters.useMySchedule
  )
}

export async function fetchDeckBatch(filters: DeckFilters, excludeIds: string[]): Promise<DeckCard[]> {
  const { data, error } = await supabase.rpc('fn_get_swipe_deck', {
    p_roles: filters.roles.length > 0 ? filters.roles : undefined,
    p_min_rank: filters.minRank === LOWEST_RANK ? undefined : filters.minRank,
    p_max_rank: filters.maxRank === HIGHEST_RANK ? undefined : filters.maxRank,
    p_match_schedule: filters.useMySchedule,
    p_exclude_ids: excludeIds,
    p_limit: DECK_BATCH_SIZE,
  })
  if (error) throw error
  return data
}

// Toda escrita de swipe passa por RPC (nunca insert direto em swipes/matches).
export async function sendSwipe(profileId: string, direction: SwipeDirection): Promise<void> {
  const { error } =
    direction === 'like'
      ? await supabase.rpc('fn_create_match_from_swipe', { p_swiped_id: profileId })
      : await supabase.rpc('fn_pass_swipe', { p_swiped_id: profileId })
  if (error) throw error
}
