import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/toast'
import { useAvailableNow } from '../../hooks/useAvailableNow'
import { useSession } from '../../hooks/useSession'
import { quickMatch, QuickMatchError, type AvailableProfile } from '../../lib/availableNow'
import type { DeckFilters } from '../../lib/deck'
import { focusRing, primaryButtonClass } from '../formStyles'
import { FunnelIcon } from '../icons'
import { AvailableItem } from './AvailableItem'
import { AvailableToggleBar } from './AvailableToggleBar'

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Carregando jogadores">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-line" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-32 rounded bg-line" />
            <div className="h-3 w-40 rounded bg-line" />
          </div>
          <div className="h-9 w-20 rounded-xl bg-line" />
        </div>
      ))}
    </div>
  )
}

const messageCardClass = 'flex flex-col items-center rounded-2xl border border-line bg-surface/60 px-6 py-10 text-center'

interface AvailableNowListProps {
  filters: DeckFilters
  onOpenFilters: () => void
}

export function AvailableNowList({ filters, onOpenFilters }: AvailableNowListProps) {
  const { session } = useSession()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const list = useAvailableNow(filters)
  const [callingId, setCallingId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { status, items, hasMore, loadingMore, loadMoreFailed, loadMore, retry } = list
  const myId = session?.user.id

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || status !== 'ready' || !hasMore || loadMoreFailed) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore()
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [status, hasMore, loadMoreFailed, loadMore, items.length])

  async function handleCall(profile: AvailableProfile) {
    if (callingId || !myId) return
    setCallingId(profile.id)
    try {
      const matchId = await quickMatch(profile.id, myId)
      showToast(`Chat iniciado com ${profile.username}`)
      navigate(`/app/matches/${matchId}`)
    } catch (error) {
      setCallingId(null)
      if (error instanceof QuickMatchError && error.reason === 'unavailable') {
        showToast(`${profile.username} não está mais disponível.`)
        retry()
      } else if (error instanceof QuickMatchError && error.reason === 'rate_limited') {
        // O limite é por minuto e por dia; o texto vale para os dois casos.
        showToast('Você atingiu o limite de chats iniciados por enquanto. Tente de novo mais tarde.')
      } else {
        showToast('Não foi possível iniciar o chat. Tente de novo.')
      }
    }
  }

  const waitingForItems = items.length === 0 && (hasMore || loadingMore)

  let body
  if (status === 'error' || (items.length === 0 && loadMoreFailed)) {
    body = (
      <div role="alert" className={messageCardClass}>
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">Não foi possível carregar a lista</h2>
        <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">Verifique sua conexão e tente de novo.</p>
        <button
          type="button"
          onClick={() => (status === 'error' ? retry() : void loadMore(true))}
          className={`mt-5 cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
        >
          Tentar novamente
        </button>
      </div>
    )
  } else if (status === 'loading') {
    body = <ListSkeleton />
  } else if (items.length === 0 && !waitingForItems) {
    body = (
      <div className={messageCardClass}>
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">Ninguém disponível agora com esses filtros</h2>
        <p className="mt-2 max-w-[300px] text-sm leading-5 text-ink-muted">
          Ajuste os filtros ou volte daqui a pouco. A lista atualiza sozinha quando alguém ficar disponível.
        </p>
        <button type="button" onClick={onOpenFilters} className={`${primaryButtonClass} mt-6 max-w-[240px]`}>
          <FunnelIcon className="h-4 w-4" />
          Ajustar filtros
        </button>
      </div>
    )
  } else {
    body = (
      <>
        {items.length === 0 ? (
          <ListSkeleton />
        ) : (
          <ul className="space-y-3">
            {items.map((profile) => (
              <AvailableItem
                key={profile.id}
                profile={profile}
                calling={callingId === profile.id}
                disabled={callingId !== null}
                onCall={handleCall}
              />
            ))}
          </ul>
        )}
        {loadingMore && items.length > 0 && (
          <div className="mt-3">
            <ListSkeleton rows={2} />
          </div>
        )}
        {loadMoreFailed && (
          <button
            type="button"
            onClick={() => void loadMore(true)}
            className={`mx-auto mt-4 block cursor-pointer rounded-xl border border-line-strong bg-field px-5 py-2.5 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
          >
            Não foi possível carregar mais. Tentar novamente
          </button>
        )}
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      </>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      <AvailableToggleBar />
      {body}
    </div>
  )
}
