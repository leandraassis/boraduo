import type { RankType, RoleType } from './gameData'
import { supabase } from './supabase'
import type { Database } from '../types/database'

export const MESSAGE_MAX_LENGTH = 2000
export const MESSAGES_LOAD_LIMIT = 200

type MatchOrigin = Database['public']['Enums']['match_origin']

export interface Conversation {
  matchId: string
  origin: MatchOrigin
  createdAt: string
  lastMessageAt: string
  other: {
    id: string
    username: string
    avatarUrl: string | null
    role: RoleType
    rank: RankType
  }
  lastMessage: { content: string; senderId: string; createdAt: string } | null
  unread: boolean
  readOnly: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
  status?: 'sending' | 'failed'
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('fn_get_conversations')
  if (error) throw error

  return data.map((row) => ({
    matchId: row.match_id,
    origin: row.origin,
    createdAt: row.match_created_at,
    lastMessageAt: row.last_message_at,
    other: {
      id: row.other_id,
      username: row.other_username,
      avatarUrl: row.other_avatar_url,
      role: row.other_role,
      rank: row.other_rank,
    },
    lastMessage:
      row.last_message_content !== null && row.last_message_sender_id && row.last_message_created_at
        ? {
            content: row.last_message_content,
            senderId: row.last_message_sender_id,
            createdAt: row.last_message_created_at,
          }
        : null,
    unread: row.unread,
    readOnly: row.read_only,
  }))
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt) || a.matchId.localeCompare(b.matchId))
}

// Quantas conversas (não mensagens) têm algo não lido; match bloqueado e mensagem própria não contam.
export async function fetchUnreadMatchesCount(): Promise<number> {
  const { data, error } = await supabase.rpc('fn_get_unread_matches_count')
  if (error) throw error
  return data
}

export async function markMatchRead(matchId: string): Promise<void> {
  const { error } = await supabase.rpc('fn_mark_match_read', { p_match_id: matchId })
  if (error) throw error
}

export async function fetchMessages(matchId: string): Promise<{ messages: ChatMessage[]; truncated: boolean }> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(MESSAGES_LOAD_LIMIT)
  if (error) throw error

  const messages = data
    .map((row) => ({ id: row.id, senderId: row.sender_id, content: row.content, createdAt: row.created_at }))
    .reverse()
  return { messages, truncated: data.length === MESSAGES_LOAD_LIMIT }
}

export class SendMessageError extends Error {
  readonly forbidden: boolean
  readonly rateLimited: boolean

  constructor(forbidden: boolean, rateLimited = false) {
    super(forbidden ? 'forbidden' : rateLimited ? 'rate_limited' : 'failed')
    this.forbidden = forbidden
    this.rateLimited = rateLimited
  }
}

// A RLS de messages valida match, contas ativas e ausência de bloqueio; violação vem como 42501.
export async function sendMessage(matchId: string, senderId: string, content: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content })
    .select('id, sender_id, content, created_at')
    .single()
  if (error) throw new SendMessageError(error.code === '42501', error.message.includes('rate_limit_exceeded'))
  return { id: data.id, senderId: data.sender_id, content: data.content, createdAt: data.created_at }
}

// Linha crua de `messages` vinda do Realtime (payload.new) -> mensagem tipada, ou null se malformada.
export function parseMessageRow(row: unknown): (ChatMessage & { matchId: string }) | null {
  if (typeof row !== 'object' || row === null) return null
  const r = row as Record<string, unknown>
  if (
    typeof r.id !== 'string' ||
    typeof r.match_id !== 'string' ||
    typeof r.sender_id !== 'string' ||
    typeof r.content !== 'string' ||
    typeof r.created_at !== 'string'
  ) {
    return null
  }
  return { id: r.id, matchId: r.match_id, senderId: r.sender_id, content: r.content, createdAt: r.created_at }
}
