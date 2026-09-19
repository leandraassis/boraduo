import type { Database } from '../types/database'
import type { RankType } from './gameData'
import { supabase } from './supabase'

export type ReportCategory = Database['public']['Enums']['report_category']

export const REPORT_DETAILS_MAX = 500

export const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'toxic_behavior', label: 'Comportamento tóxico' },
  { value: 'cheating', label: 'Trapaça / cheating' },
  { value: 'fake_profile', label: 'Perfil falso' },
  { value: 'harassment', label: 'Assédio' },
  { value: 'other', label: 'Outro' },
]

// Bloqueio e denúncia passam só por RPC SECURITY DEFINER: o client não tem insert em blocks/reports.
export async function blockUser(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('fn_block_user', { p_target_id: targetId })
  if (error) throw error
}

export class ModerationError extends Error {
  readonly rateLimited: boolean

  constructor(rateLimited: boolean) {
    super(rateLimited ? 'rate_limited' : 'failed')
    this.rateLimited = rateLimited
  }
}

// A denúncia também cria o bloqueio (par normalizado) no servidor.
export async function reportUser(targetId: string, category: ReportCategory, details: string): Promise<void> {
  const { error } = await supabase.rpc('fn_report_user', {
    p_target_id: targetId,
    p_category: category,
    p_details: details.trim(),
  })
  if (error) throw new ModerationError(error.message.includes('rate_limit_exceeded'))
}

export interface BlockedUser {
  blockId: string
  other: { id: string; username: string; avatarUrl: string | null; rank: RankType }
  createdAt: string
  // Só bloqueio voluntário (sem denúncia) pode ser desfeito pelo próprio usuário.
  reversible: boolean
}

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase.rpc('fn_get_blocked_users')
  if (error) throw error

  return data.map((row) => ({
    blockId: row.block_id,
    other: { id: row.other_id, username: row.other_username, avatarUrl: row.other_avatar_url, rank: row.other_rank },
    createdAt: row.created_at,
    reversible: row.reversible,
  }))
}

// A policy "delete own voluntary block" só deixa passar o bloqueio voluntário de quem o criou; nos demais
// casos o delete não afeta nenhuma linha (sem erro), então a ausência de linha removida vira falha.
export async function unblockUser(blockId: string): Promise<void> {
  const { data, error } = await supabase.from('blocks').delete().eq('id', blockId).select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('block not removed')
}
