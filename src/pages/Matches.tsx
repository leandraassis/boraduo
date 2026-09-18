import { useMemo } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import { ConversationList } from '../components/matches/ConversationList'
import type { MatchesOutletContext } from '../components/matches/context'
import { useConversations } from '../hooks/useConversations'
import { useConversationsRealtime } from '../hooks/useConversationsRealtime'
import { useSession } from '../hooks/useSession'

const paneClass = 'min-w-0 flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:bg-surface/40'

export function Matches() {
  const { session } = useSession()
  const { status, conversations, reload, reloadSilently, patchConversation } = useConversations()
  const chatMatch = useMatch('/app/matches/:matchId')
  const selectedMatchId = chatMatch?.params.matchId
  const inChat = selectedMatchId !== undefined
  const currentUserId = session?.user.id

  // Mensagem nova em qualquer conversa: atualiza prévia/ordem e marca "não lida" quando é do outro e a
  // conversa não está aberta (a aberta já é lida pelo ChatView). Conversa desconhecida -> recarrega.
  useConversationsRealtime(
    currentUserId,
    conversations.map((c) => c.matchId),
    {
      onMessage: (message) => {
        if (!conversations.some((c) => c.matchId === message.matchId)) {
          reloadSilently(selectedMatchId)
          return
        }
        patchConversation(message.matchId, {
          lastMessage: { content: message.content, senderId: message.senderId, createdAt: message.createdAt },
          lastMessageAt: message.createdAt,
          ...(message.senderId !== currentUserId ? { unread: message.matchId !== selectedMatchId } : {}),
        })
      },
      onNewMatch: () => reloadSilently(selectedMatchId),
      onSubscribed: () => reloadSilently(selectedMatchId),
    },
  )

  const outletContext = useMemo<MatchesOutletContext>(
    () => ({ currentUserId, status, conversations, patchConversation, reloadConversations: reload }),
    [currentUserId, status, conversations, patchConversation, reload],
  )

  return (
    <div className="flex-1 bg-canvas font-inter text-ink">
      <div className="mx-auto flex h-[calc(100dvh-var(--app-nav-h))] w-full max-w-[1180px] lg:gap-6 lg:p-6">
        <aside className={`${inChat ? 'hidden lg:flex' : 'flex'} ${paneClass} w-full lg:w-[380px] lg:shrink-0`}>
          <header className="px-4 pt-6 pb-4 lg:px-5">
            <h1 className="text-2xl leading-8 font-bold tracking-[-0.02em]">Matches</h1>
          </header>
          <div className="flex-1 overflow-y-auto pb-2">
            <ConversationList
              status={status}
              conversations={conversations}
              selectedMatchId={selectedMatchId}
              currentUserId={currentUserId}
              onRetry={reload}
            />
          </div>
        </aside>

        <section className={`${inChat ? 'flex' : 'hidden lg:flex'} ${paneClass} flex-1`}>
          <Outlet context={outletContext} />
        </section>
      </div>
    </div>
  )
}
