import { Link } from 'react-router-dom'
import type { Conversation } from '../../lib/chat'
import { RANK_INFO, ROLE_INFO } from '../../lib/gameData'
import { Avatar } from '../Avatar'
import { focusRing } from '../formStyles'
import { ArrowLeftIcon } from '../icons'
import { RoleIcon } from '../RoleIcon'
import { ChatOptionsMenu } from './ChatOptionsMenu'

interface ChatHeaderProps {
  conversation: Conversation
  onModerated: (kind: 'blocked' | 'reported') => void
}

export function ChatHeader({ conversation, onModerated }: ChatHeaderProps) {
  const { other } = conversation
  const rank = RANK_INFO[other.rank]

  return (
    <header className="flex items-center gap-3 border-b border-line px-4 py-3 lg:px-5">
      <Link
        to="/app/matches"
        aria-label="Voltar para as conversas"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:text-ink lg:hidden ${focusRing}`}
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </Link>

      <Avatar url={other.avatarUrl} name={other.username} className="h-11 w-11" />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base leading-6 font-semibold tracking-[-0.01em] text-ink">{other.username}</h2>
        <p className="flex items-center gap-2.5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1 text-match">
            <RoleIcon role={other.role} className="h-3.5 w-3.5" />
            {ROLE_INFO[other.role].label}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rank.color }} aria-hidden="true" />
            {rank.label}
          </span>
        </p>
      </div>

      <ChatOptionsMenu
        username={other.username}
        otherId={other.id}
        readOnly={conversation.readOnly}
        onModerated={onModerated}
      />
    </header>
  )
}
