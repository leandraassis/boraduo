import { useState } from 'react'
import type { DeckCard, SwipeDirection } from '../../lib/deck'
import { focusRing } from '../formStyles'
import { CloseIcon, HeartIcon } from '../icons'
import { SwipeCard } from './SwipeCard'

interface SwipeDeckProps {
  cards: DeckCard[]
  onSwipe: (card: DeckCard, direction: SwipeDirection) => void
}

export function SwipeDeck({ cards, onSwipe }: SwipeDeckProps) {
  const [exiting, setExiting] = useState<SwipeDirection | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const top = cards[0]
  const next = cards[1]
  const disabled = !top || exiting !== null

  function requestSwipe(direction: SwipeDirection) {
    if (!top || exiting) return
    setExiting(direction)
  }

  function handleExited() {
    if (!top || !exiting) return
    onSwipe(top, exiting)
    setAnnouncement(exiting === 'like' ? `Você curtiu ${top.username}` : `Você passou ${top.username}`)
    setExiting(null)
  }

  return (
    <>
      <div className="relative min-h-[420px] flex-1 md:max-h-[640px]">
        {next && (
          <SwipeCard key={next.id} card={next} depth={1} exit={null} onCommit={requestSwipe} onExited={handleExited} />
        )}
        {top && (
          <SwipeCard key={top.id} card={top} depth={0} exit={exiting} onCommit={requestSwipe} onExited={handleExited} />
        )}
      </div>

      <div className="mt-3 flex items-start justify-center gap-10">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => requestSwipe('pass')}
            disabled={disabled}
            aria-label="Passar"
            className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-danger bg-surface/90 text-danger transition hover:shadow-glow-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${focusRing}`}
          >
            <CloseIcon className="h-7 w-7" />
          </button>
          <span className="text-[11px] leading-4 font-semibold tracking-[0.04em] text-ink-muted uppercase">Passar</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => requestSwipe('like')}
            disabled={disabled}
            aria-label="Curtir"
            className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-ready bg-surface/90 text-ready transition hover:shadow-glow-ready disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${focusRing}`}
          >
            <HeartIcon className="h-7 w-7" />
          </button>
          <span className="text-[11px] leading-4 font-semibold tracking-[0.04em] text-ink-muted uppercase">Curtir</span>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  )
}
