import { createContext, useContext } from 'react'

export interface NotificationsContextValue {
  unreadCount: number
  // Busca a contagem de novo (select count). Só a resposta da requisição mais recente vale.
  refreshUnreadCount: () => Promise<void>
  // Ajuste otimista local (ex.: ao abrir uma notificação), reconciliado por refreshUnreadCount.
  adjustUnreadCount: (delta: number) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function useNotifications(): NotificationsContextValue {
  const value = useContext(NotificationsContext)
  if (!value) throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
  return value
}
