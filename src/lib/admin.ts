import { MESSAGES_LOAD_LIMIT, type ChatMessage } from './chat'
import type { ReportCategory } from './moderation'
import type { RankType, RoleType } from './gameData'
import { supabase } from './supabase'

export const ADMIN_USERS_PAGE_SIZE = 20
// Busca por username exige um trecho mínimo (o servidor recusa menos que isso); e-mail (com @) é sempre exato.
export const ADMIN_SEARCH_MIN_LENGTH = 3

export type AdminStatusFilter = 'all' | 'active' | 'banned'

export interface AdminFilters {
  // Já aparado. Vazio = sem busca. Com "@" é e-mail exato; sem, é trecho do username.
  query: string
  status: AdminStatusFilter
  // Fila de denunciados. A busca por texto substitui a fila (o servidor também ignora este filtro com busca).
  onlyReported: boolean
}

export interface AdminUser {
  id: string
  username: string
  avatarUrl: string | null
  banned: boolean
  isAdmin: boolean
  role: RoleType
  rank: RankType
  mainAgentId: string
  createdAt: string
  bannedAt: string | null
  pendingReports: number
  // Só vem preenchido na busca por e-mail.
  email: string | null
}

export interface AdminUsersCursor {
  sortAt: string
  id: string
}

export interface AdminUsersPage {
  users: AdminUser[]
  // Próxima página; null quando a lista acabou.
  next: AdminUsersCursor | null
}

export interface AdminReport {
  id: string
  category: ReportCategory
  details: string | null
  pending: boolean
  createdAt: string
  reporterUsername: string | null
}

// username não é único: o id curto (8 primeiros caracteres do uuid) ajuda o admin a distinguir homônimos.
export function shortId(id: string): string {
  return id.slice(0, 8)
}

export function isEmailQuery(query: string): boolean {
  return query.includes('@')
}

export function isQueryTooShort(query: string): boolean {
  return query !== '' && !isEmailQuery(query) && query.length < ADMIN_SEARCH_MIN_LENGTH
}

// Listagem, ban e unban passam só por RPC SECURITY DEFINER que exige permission_level = 'admin': a RLS de
// profiles esconde os banidos do admin, e o client nunca escreve em status/banned_* direto.
export async function fetchAdminUsers(filters: AdminFilters, cursor: AdminUsersCursor | null): Promise<AdminUsersPage> {
  // Pede uma linha a mais só para saber se existe próxima página (sem "Carregar mais" que devolve vazio).
  const { data, error } = await supabase.rpc('fn_admin_list_users', {
    p_query: filters.query || undefined,
    p_status: filters.status === 'all' ? undefined : filters.status,
    p_only_reported: filters.onlyReported,
    p_limit: ADMIN_USERS_PAGE_SIZE + 1,
    p_cursor_sort_at: cursor?.sortAt,
    p_cursor_id: cursor?.id,
  })
  if (error) throw error

  const rows = data.slice(0, ADMIN_USERS_PAGE_SIZE)
  const last = rows[rows.length - 1]
  return {
    users: rows.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      banned: row.status === 'banned',
      isAdmin: row.permission_level === 'admin',
      role: row.role,
      rank: row.rank,
      mainAgentId: row.main_agent_id,
      createdAt: row.created_at,
      bannedAt: row.banned_at,
      pendingReports: row.pending_reports,
      email: row.email,
    })),
    next: data.length > ADMIN_USERS_PAGE_SIZE ? { sortAt: last.sort_at, id: last.id } : null,
  }
}

export async function fetchUserReports(targetId: string): Promise<AdminReport[]> {
  const { data, error } = await supabase.rpc('fn_admin_get_user_reports', { p_target_id: targetId })
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    category: row.category,
    details: row.details,
    pending: row.status === 'pending',
    createdAt: row.created_at,
    reporterUsername: row.reporter_username,
  }))
}

export async function banUser(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('fn_admin_ban_user', { p_target_id: targetId })
  if (error) throw error
}

export async function unbanUser(targetId: string): Promise<void> {
  const { error } = await supabase.rpc('fn_admin_unban_user', { p_target_id: targetId })
  if (error) throw error
}

// Marca uma denúncia como revisada sem banir o denunciado. O bloqueio criado pela denúncia continua
// intacto — são decisões separadas.
export async function reviewReport(reportId: string): Promise<void> {
  const { error } = await supabase.rpc('fn_admin_review_report', { p_report_id: reportId })
  if (error) throw error
}

// Conversa entre denunciante e denunciado daquela denúncia específica. Só funciona enquanto a
// denúncia está pendente (o servidor recusa depois de revisada, mesmo que a UI já tenha escondido
// o botão). O client nunca escolhe os dois usuários — a RPC resolve isso a partir do report_id.
export async function fetchReportConversation(reportId: string): Promise<{ messages: ChatMessage[]; truncated: boolean }> {
  const { data, error } = await supabase.rpc('fn_admin_get_report_conversation', { p_report_id: reportId })
  if (error) throw error

  const messages = data.map((row) => ({ id: row.id, senderId: row.sender_id, content: row.content, createdAt: row.created_at }))
  return { messages, truncated: data.length === MESSAGES_LOAD_LIMIT }
}
