import { NotificationItem } from '../components/notifications/NotificationItem'
import { NotificationsEmpty, NotificationsError, NotificationsSkeleton } from '../components/notifications/NotificationStates'
import { useNotifications } from '../contexts/notifications'
import { useNotificationsList } from '../hooks/useNotificationsList'
import { markNotificationRead, type AppNotification } from '../lib/notifications'

export function Notifications() {
  const { status, items, retry, markReadLocally } = useNotificationsList()
  const { adjustUnreadCount, refreshUnreadCount } = useNotifications()

  // Abrir o item marca como lida (req. 43) e o link já leva ao chat. Atualização otimista da lista e
  // do badge; a contagem real é rebuscada depois do update, então uma falha não deixa o badge mentindo.
  function handleOpen(notification: AppNotification) {
    if (notification.read) return
    markReadLocally(notification.id)
    adjustUnreadCount(-1)
    markNotificationRead(notification.id)
      .catch(() => undefined)
      .finally(() => void refreshUnreadCount())
  }

  return (
    <div className="flex-1 bg-canvas font-inter text-ink">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-6 pb-6 md:max-w-[640px]">
        <h1 className="mb-4 text-2xl leading-8 font-bold tracking-[-0.02em]">Notificações</h1>

        {status === 'loading' && <NotificationsSkeleton />}
        {status === 'error' && <NotificationsError onRetry={retry} />}
        {status === 'ready' &&
          (items.length === 0 ? (
            <NotificationsEmpty />
          ) : (
            <ul className="space-y-3">
              {items.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onOpen={handleOpen} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}
