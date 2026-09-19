import { useSwipeDeck } from '../../hooks/useSwipeDeck'
import type { DeckFilters } from '../../lib/deck'
import { DeckEmptyState, DeckError, DeckSkeleton } from './DeckStates'
import { SwipeDeck } from './SwipeDeck'

interface SwipeModeProps {
  filters: DeckFilters
  onOpenFilters: () => void
}

export function SwipeMode({ filters, onOpenFilters }: SwipeModeProps) {
  const deck = useSwipeDeck(filters)
  const waitingForMore = deck.cards.length === 0 && deck.loadingMore

  let content
  if (deck.status === 'loading' || waitingForMore) {
    content = <DeckSkeleton />
  } else if (deck.status === 'error' || (deck.cards.length === 0 && deck.loadMoreFailed)) {
    content = <DeckError onRetry={deck.retry} />
  } else if (deck.cards.length === 0) {
    content = <DeckEmptyState onAdjustFilters={onOpenFilters} />
  } else {
    content = <SwipeDeck cards={deck.cards} onSwipe={deck.swipe} />
  }

  return (
    <>
      {deck.actionError && (
        <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          Não foi possível registrar seu swipe. Tente de novo.
        </p>
      )}
      {content}
    </>
  )
}
