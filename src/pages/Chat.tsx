import { useCallback, useEffect } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ChatHeader } from '../components/chat/ChatHeader'
import { MessageComposer } from '../components/chat/MessageComposer'
import { MessageList } from '../components/chat/MessageList'
import { ChatError, ChatNotFound, ChatSkeleton, ReadOnlyNotice } from '../components/chat/ChatStates'
import type { MatchesOutletContext } from '../components/matches/context'
import { useToast } from '../contexts/toast'
import { useChatMessages } from '../hooks/useChatMessages'
import { useMessageRealtime } from '../hooks/useMessageRealtime'
import { markMatchRead, sendMessage, SendMessageError, type Conversation } from '../lib/chat'

interface ChatViewProps {
  conversation: Conversation
  currentUserId: string
  patchConversation: MatchesOutletContext['patchConversation']
}

function ChatView({ conversation, currentUserId, patchConversation }: ChatViewProps) {
  const { matchId } = conversation
  const { showToast } = useToast()
  const chat = useChatMessages(matchId)
  const { messages, addMessage, receiveMessage, reloadSilently, replaceMessage, patchMessage } = chat

  useEffect(() => {
    let cancelled = false
    markMatchRead(matchId)
      .then(() => {
        if (!cancelled) patchConversation(matchId, { unread: false })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [matchId, patchConversation])

  // Mensagens próprias seguem pelo fluxo de envio (otimista + replace); só as do outro entram por aqui.
  useMessageRealtime(matchId, {
    onInsert: (message) => {
      if (message.senderId === currentUserId) return
      receiveMessage(message)
      patchConversation(matchId, {
        lastMessage: { content: message.content, senderId: message.senderId, createdAt: message.createdAt },
        lastMessageAt: message.createdAt,
      })
      // A conversa está aberta: a mensagem já foi vista.
      markMatchRead(matchId)
        .then(() => patchConversation(matchId, { unread: false }))
        .catch(() => undefined)
    },
    onSubscribed: reloadSilently,
  })

  const deliver = useCallback(
    async (pendingId: string, content: string) => {
      try {
        const saved = await sendMessage(matchId, currentUserId, content)
        replaceMessage(pendingId, saved)
        patchConversation(matchId, {
          lastMessage: { content: saved.content, senderId: saved.senderId, createdAt: saved.createdAt },
          lastMessageAt: saved.createdAt,
        })
      } catch (error) {
        patchMessage(pendingId, { status: 'failed' })
        if (error instanceof SendMessageError && error.forbidden) {
          patchConversation(matchId, { readOnly: true })
        }
      }
    },
    [matchId, currentUserId, replaceMessage, patchMessage, patchConversation],
  )

  // Bloqueio (voluntário ou por denúncia) encerra a conversa na hora: composer vira aviso de somente leitura.
  function handleModerated(kind: 'blocked' | 'reported') {
    patchConversation(matchId, { readOnly: true })
    const name = conversation.other.username
    showToast(kind === 'blocked' ? `${name} foi bloqueado.` : `Denúncia enviada. ${name} foi bloqueado.`)
  }

  function handleSend(content: string) {
    const pendingId = `pending-${crypto.randomUUID()}`
    addMessage({ id: pendingId, senderId: currentUserId, content, createdAt: new Date().toISOString(), status: 'sending' })
    void deliver(pendingId, content)
  }

  function handleRetry(messageId: string) {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return
    patchMessage(messageId, { status: 'sending' })
    void deliver(messageId, message.content)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader conversation={conversation} onModerated={handleModerated} />

      {chat.status === 'loading' && <ChatSkeleton />}
      {chat.status === 'error' && <ChatError onRetry={chat.retry} />}
      {chat.status === 'ready' && (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          truncated={chat.truncated}
          canRetry={!conversation.readOnly}
          onRetry={handleRetry}
        />
      )}

      {conversation.readOnly ? <ReadOnlyNotice /> : chat.status === 'ready' && <MessageComposer onSend={handleSend} />}
    </div>
  )
}

export function Chat() {
  const { matchId } = useParams()
  const { currentUserId, status, conversations, patchConversation, reloadConversations } =
    useOutletContext<MatchesOutletContext>()

  if (status === 'loading' || !currentUserId) return <ChatSkeleton />
  if (status === 'error') return <ChatError onRetry={reloadConversations} />

  const conversation = conversations.find((c) => c.matchId === matchId)
  if (!conversation) return <ChatNotFound />

  return (
    <ChatView
      key={conversation.matchId}
      conversation={conversation}
      currentUserId={currentUserId}
      patchConversation={patchConversation}
    />
  )
}
