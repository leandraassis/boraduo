import { Link } from 'react-router-dom'
import { formatListTimestamp } from '../../lib/format'
import type { AppNotification } from '../../lib/notifications'
import { Avatar } from '../Avatar'
import { focusRing } from '../formStyles'

interface NotificationItemProps {
  notification: AppNotification
  onOpen: (notification: AppNotification) => void
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const { read, other, matchId, createdAt } = notification
  const name = other?.username ?? 'um jogador'

  const className = `flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${focusRing} ${
    read ? 'border-line bg-surface hover:border-line-strong' : 'border-brand/50 bg-brand/10 hover:border-brand'
  }`

  const content = (
    <>
      <Avatar url={other?.avatarUrl ?? null} name={name} className="h-12 w-12" />

      <div className="min-w-0 flex-1">
        <p className={`text-[15px] leading-5 wrap-anywhere ${read ? 'text-ink-muted' : 'font-semibold text-ink'}`}>
          Novo match com <span className={read ? 'font-medium text-ink' : 'font-bold'}>{name}</span>
        </p>
        <time dateTime={createdAt} className={`mt-1 block text-xs ${read ? 'text-ink-muted' : 'font-semibold text-match'}`}>
          {formatListTimestamp(createdAt)}
        </time>
      </div>

      {!read && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-match shadow-glow-brand" data-testid="unread-dot">
          <span className="sr-only">Não lida</span>
        </span>
      )}
    </>
  )

  return (
    <li data-testid="notification-item" data-read={read ? 'true' : 'false'}>
      {matchId ? (
        <Link to={`/app/matches/${matchId}`} onClick={() => onOpen(notification)} className={className}>
          {content}
        </Link>
      ) : (
        // Match que não existe mais: ainda dá para marcar como lida, mas não há chat para abrir.
        <button type="button" onClick={() => onOpen(notification)} className={`${className} cursor-pointer`}>
          {content}
        </button>
      )}
    </li>
  )
}
