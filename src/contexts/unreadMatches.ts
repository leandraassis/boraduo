import { createContext, useContext } from 'react'

export interface UnreadMatchesContextValue {
  // Quantidade de matches com mensagem não lida (uma por conversa, não por mensagem).
  unreadMatchesCount: number
}

export const UnreadMatchesContext = createContext<UnreadMatchesContextValue | null>(null)

export function useUnreadMatches(): UnreadMatchesContextValue {
  const value = useContext(UnreadMatchesContext)
  if (!value) throw new Error('useUnreadMatches deve ser usado dentro de UnreadMatchesProvider')
  return value
}
