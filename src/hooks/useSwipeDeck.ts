import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DECK_BATCH_SIZE,
  DECK_PREFETCH_THRESHOLD,
  fetchDeckBatch,
  sendSwipe,
  type DeckCard,
  type DeckFilters,
  type SwipeDirection,
} from '../lib/deck'

interface DeckState {
  filters: DeckFilters
  reload: number
  status: 'loading' | 'ready' | 'error'
  cards: DeckCard[]
  hasMore: boolean
  loadingMore: boolean
  loadMoreFailed: boolean
  actionError: boolean
}

function initialState(filters: DeckFilters, reload: number): DeckState {
  return {
    filters,
    reload,
    status: 'loading',
    cards: [],
    hasMore: true,
    loadingMore: false,
    loadMoreFailed: false,
    actionError: false,
  }
}

export function useSwipeDeck(filters: DeckFilters) {
  const [reload, setReload] = useState(0)
  const [state, setState] = useState<DeckState>(() => initialState(filters, 0))
  const seenRef = useRef(new Set<string>())
  const fetchingMoreRef = useRef(false)

  if (state.filters !== filters || state.reload !== reload) {
    setState(initialState(filters, reload))
  }

  useEffect(() => {
    let cancelled = false
    seenRef.current = new Set()
    fetchingMoreRef.current = false

    const isCurrent = (s: DeckState) => s.filters === filters && s.reload === reload

    fetchDeckBatch(filters, [])
      .then((batch) => {
        if (cancelled) return
        batch.forEach((card) => seenRef.current.add(card.id))
        setState((s) =>
          isCurrent(s) ? { ...s, status: 'ready', cards: batch, hasMore: batch.length >= DECK_BATCH_SIZE } : s,
        )
      })
      .catch(() => {
        if (cancelled) return
        setState((s) => (isCurrent(s) ? { ...s, status: 'error' } : s))
      })

    return () => {
      cancelled = true
    }
  }, [filters, reload])

  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current) return
    fetchingMoreRef.current = true
    const isCurrent = (s: DeckState) => s.filters === filters && s.reload === reload

    setState((s) => (isCurrent(s) ? { ...s, loadingMore: true, loadMoreFailed: false } : s))
    try {
      const batch = await fetchDeckBatch(filters, [...seenRef.current])
      const fresh = batch.filter((card) => !seenRef.current.has(card.id))
      fresh.forEach((card) => seenRef.current.add(card.id))
      setState((s) =>
        isCurrent(s)
          ? { ...s, cards: [...s.cards, ...fresh], hasMore: batch.length >= DECK_BATCH_SIZE, loadingMore: false }
          : s,
      )
    } catch {
      setState((s) => (isCurrent(s) ? { ...s, loadingMore: false, loadMoreFailed: true } : s))
    } finally {
      fetchingMoreRef.current = false
    }
  }, [filters, reload])

  const swipe = useCallback(
    async (card: DeckCard, direction: SwipeDirection) => {
      const remaining = state.cards.filter((c) => c.id !== card.id).length
      setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== card.id), actionError: false }))

      if (remaining <= DECK_PREFETCH_THRESHOLD && state.hasMore && !fetchingMoreRef.current) {
        void loadMore()
      }

      try {
        await sendSwipe(card.id, direction)
      } catch {
        setState((s) => ({
          ...s,
          cards: [card, ...s.cards.filter((c) => c.id !== card.id)],
          actionError: true,
        }))
      }
    },
    [state.cards, state.hasMore, loadMore],
  )

  const retry = useCallback(() => setReload((n) => n + 1), [])

  return {
    cards: state.cards,
    status: state.status,
    loadingMore: state.loadingMore,
    loadMoreFailed: state.loadMoreFailed,
    actionError: state.actionError,
    swipe,
    retry,
  }
}
