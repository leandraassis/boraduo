import { useEffect, useRef } from 'react'
import { MESSAGES_LOAD_LIMIT, type ChatMessage } from '../../lib/chat'
import { dayKey, formatDayLabel, formatTime } from '../../lib/format'

interface MessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  truncated: boolean
  canRetry: boolean
  onRetry: (messageId: string) => void
  emptyMessage?: string
}

export function MessageList({
  messages,
  currentUserId,
  truncated,
  canRetry,
  onRetry,
  emptyMessage = 'Nenhuma mensagem ainda. Diga oi!',
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  return (
    <div ref={scrollRef} role="log" aria-label="Mensagens" className="flex-1 overflow-y-auto px-4 py-4 lg:px-5">
      {truncated && (
        <p className="mb-4 text-center text-xs text-ink-muted">Mostrando as últimas {MESSAGES_LOAD_LIMIT} mensagens.</p>
      )}

      {messages.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">{emptyMessage}</p>
      ) : (
        <ul>
          {messages.map((message, index) => {
            const previous = messages[index - 1]
            const mine = message.senderId === currentUserId
            const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
            const newSender = !previous || previous.senderId !== message.senderId
            const failed = message.status === 'failed'
            const sending = message.status === 'sending'

            return (
              <li key={message.id}>
                {newDay && (
                  <div className="flex justify-center py-3">
                    <span className="rounded-full border border-line bg-surface px-3 py-1 text-[11px] leading-4 font-semibold tracking-[0.04em] text-ink-muted uppercase">
                      {formatDayLabel(message.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  data-mine={mine ? 'true' : 'false'}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'} ${newSender && !newDay ? 'mt-3' : 'mt-1'}`}
                >
                  <div className={`flex min-w-0 max-w-[80%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-5 wrap-anywhere whitespace-pre-wrap text-ink ${
                        mine ? 'rounded-br-md bg-brand' : 'rounded-bl-md border border-line bg-surface'
                      } ${sending ? 'opacity-70' : ''} ${failed ? 'ring-1 ring-danger/70' : ''}`}
                    >
                      {message.content}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] leading-4 text-ink-muted">
                      {!failed && <time dateTime={message.createdAt}>{sending ? 'Enviando...' : formatTime(message.createdAt)}</time>}
                      {failed &&
                        (canRetry ? (
                          <button
                            type="button"
                            onClick={() => onRetry(message.id)}
                            className="cursor-pointer text-danger hover:underline"
                          >
                            Não enviada. Tentar novamente
                          </button>
                        ) : (
                          <span className="text-danger">Não enviada</span>
                        ))}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
