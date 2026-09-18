import { Link } from 'react-router-dom'
import type { Conversation } from '../../lib/chat'
import { RANK_INFO } from '../../lib/gameData'
import { formatListTimestamp } from '../../lib/format'
import { Avatar } from '../Avatar'
import { focusRing, primaryButtonClass } from '../formStyles'
import { ChatIcon, LockIcon } from '../icons'

interface ConversationItemProps {
  conversation: Conversation
  selected: boolean
  currentUserId: string | undefined
}

function previewText(conversation: Conversation, currentUserId: string | undefined): string {
  const last = conversation.lastMessage
  if (!last) return 'Novo match. Comece a conversa!'
  const text = last.content.replace(/\s+/g, ' ').trim()
  return last.senderId === currentUserId ? `Você: ${text}` : text
}

function ConversationItem({ conversation, selected, currentUserId }: ConversationItemProps) {
  const { other, unread, readOnly } = conversation
  const rank = RANK_INFO[other.rank]
  const timestamp = formatListTimestamp(conversation.lastMessage?.createdAt ?? conversation.lastMessageAt)

  return (
    <Link
      to={`/app/matches/${conversation.matchId}`}
      aria-current={selected ? 'page' : undefined}
      data-unread={unread ? 'true' : 'false'}
      data-readonly={readOnly ? 'true' : 'false'}
      className={`flex gap-3 rounded-2xl border p-3.5 transition ${focusRing} ${
        selected ? 'border-brand bg-brand/10' : 'border-line bg-surface hover:border-line-strong'
      } ${readOnly ? 'opacity-60' : ''}`}
    >
      <Avatar url={other.avatarUrl} name={other.username} className="h-12 w-12" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-[15px] leading-5 ${unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>
            {other.username}
          </p>
          <time
            dateTime={conversation.lastMessage?.createdAt ?? conversation.lastMessageAt}
            className={`shrink-0 text-xs ${unread ? 'font-semibold text-match' : 'text-ink-muted'}`}
          >
            {timestamp}
          </time>
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          {conversation.origin === 'swipe' && (
            <span className="rounded-md bg-brand/20 px-1.5 py-0.5 text-[10px] leading-3 font-semibold tracking-[0.04em] text-brand-soft uppercase">
              Swipe
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rank.color }} aria-hidden="true" />
            {rank.label}
          </span>
          {readOnly && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <LockIcon className="h-3 w-3" />
              Somente leitura
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${unread ? 'text-ink' : 'text-ink-muted'}`}>
            {previewText(conversation, currentUserId)}
          </p>
          {unread && (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-match shadow-[0_0_10px_rgba(34,211,238,0.6)]" aria-hidden="true" />
              <span className="sr-only">Mensagem não lida</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ConversationSkeleton() {
  return (
    <div className="space-y-3 px-4 lg:px-3" role="status" aria-busy="true" aria-label="Carregando conversas">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex animate-pulse gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-line" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex justify-between gap-6">
              <div className="h-4 w-28 rounded bg-line" />
              <div className="h-3 w-10 rounded bg-line" />
            </div>
            <div className="h-3 w-24 rounded bg-line" />
            <div className="h-3.5 w-full rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface ConversationListProps {
  status: 'loading' | 'ready' | 'error'
  conversations: Conversation[]
  selectedMatchId: string | undefined
  currentUserId: string | undefined
  onRetry: () => void
}

export function ConversationList({
  status,
  conversations,
  selectedMatchId,
  currentUserId,
  onRetry,
}: ConversationListProps) {
  if (status === 'loading') return <ConversationSkeleton />

  if (status === 'error') {
    return (
      <div role="alert" className="mx-4 rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center lg:mx-3">
        <h2 className="text-base font-semibold text-ink">Não foi possível carregar as conversas</h2>
        <p className="mt-2 text-sm text-ink-muted">Verifique sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={onRetry}
          className={`mt-5 cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="mx-4 flex flex-col items-center rounded-2xl border border-line bg-surface/60 px-6 py-12 text-center lg:mx-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-field text-match">
          <ChatIcon className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">Nenhum match ainda</h2>
        <p className="mt-2 max-w-[260px] text-sm leading-5 text-ink-muted">
          Curta perfis em Descobrir. Quando o like for mútuo, a conversa aparece aqui.
        </p>
        <Link to="/app/discover" className={`${primaryButtonClass} mt-6 max-w-[220px]`}>
          Ir para Descobrir
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3 px-4 pb-6 lg:px-3">
      {conversations.map((conversation) => (
        <li key={conversation.matchId}>
          <ConversationItem
            conversation={conversation}
            selected={conversation.matchId === selectedMatchId}
            currentUserId={currentUserId}
          />
        </li>
      ))}
    </ul>
  )
}
