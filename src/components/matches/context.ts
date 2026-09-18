import type { Conversation } from '../../lib/chat'

export interface MatchesOutletContext {
  currentUserId: string | undefined
  status: 'loading' | 'ready' | 'error'
  conversations: Conversation[]
  patchConversation: (matchId: string, patch: Partial<Conversation>) => void
  reloadConversations: () => void
}
