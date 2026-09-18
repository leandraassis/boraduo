import { useState } from 'react'
import { DeckEmptyState, DeckError, DeckSkeleton } from '../components/discover/DeckStates'
import { FilterControl } from '../components/discover/FilterControl'
import { SwipeDeck } from '../components/discover/SwipeDeck'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { useSwipeDeck } from '../hooks/useSwipeDeck'
import { DEFAULT_FILTERS, type DeckFilters } from '../lib/deck'
import { parseSchedule } from '../lib/gameData'

export function Discover() {
  const { session } = useSession()
  const { profile } = useProfile(session?.user.id)
  const [filters, setFilters] = useState<DeckFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const deck = useSwipeDeck(filters)

  const mySchedule = parseSchedule(profile?.availability_schedule ?? null)
  const waitingForMore = deck.cards.length === 0 && deck.loadingMore

  let content
  if (deck.status === 'loading' || waitingForMore) {
    content = <DeckSkeleton />
  } else if (deck.status === 'error' || (deck.cards.length === 0 && deck.loadMoreFailed)) {
    content = <DeckError onRetry={deck.retry} />
  } else if (deck.cards.length === 0) {
    content = <DeckEmptyState onAdjustFilters={() => setFiltersOpen(true)} />
  } else {
    content = <SwipeDeck cards={deck.cards} onSwipe={deck.swipe} />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas font-inter text-ink">
      <header className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-4 px-4 pt-6 pb-4">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.02em]">Descobrir</h1>
        <FilterControl
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={filters}
          mySchedule={mySchedule}
          onApply={setFilters}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {deck.actionError && (
          <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            Não foi possível registrar seu swipe. Tente de novo.
          </p>
        )}
        {content}
      </main>
    </div>
  )
}
