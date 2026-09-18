import { useCallback, useEffect, useRef, useState } from 'react'
import { useAvailability } from '../contexts/availability'
import type { DeckFilters } from '../lib/deck'
import {
  AVAILABLE_PAGE_SIZE,
  cursorOf,
  fetchAvailablePage,
  mergeAvailable,
  type AvailableCursor,
  type AvailableProfile,
} from '../lib/availableNow'

interface AvailableState {
  filters: DeckFilters
  reload: number
  status: 'loading' | 'ready' | 'error'
  items: AvailableProfile[]
  cursor: AvailableCursor | null
  hasMore: boolean
  loadingMore: boolean
  loadMoreFailed: boolean
}

function initialState(filters: DeckFilters, reload: number): AvailableState {
  return {
    filters,
    reload,
    status: 'loading',
    items: [],
    cursor: null,
    hasMore: true,
    loadingMore: false,
    loadMoreFailed: false,
  }
}

export function useAvailableNow(filters: DeckFilters) {
  const { presence } = useAvailability()
  const [reload, setReload] = useState(0)
  const [state, setState] = useState<AvailableState>(() => initialState(filters, 0))
  const onlineRef = useRef<ReadonlySet<string>>(presence.onlineIds)
  const knownRef = useRef(new Set<string>())
  const fetchingMoreRef = useRef(false)

  if (state.filters !== filters || state.reload !== reload) {
    setState(initialState(filters, reload))
  }

  useEffect(() => {
    onlineRef.current = presence.onlineIds
  }, [presence.onlineIds])

  const presenceReady = presence.status === 'ready'

  // Primeira página: só depois de o canal sincronizar, para não piscar "ninguém disponível".
  useEffect(() => {
    if (!presenceReady) return
    let cancelled = false
    const ids = [...onlineRef.current]
    knownRef.current = new Set(ids)
    fetchingMoreRef.current = false
    const isCurrent = (s: AvailableState) => s.filters === filters && s.reload === reload

    fetchAvailablePage(filters, ids, null)
      .then((page) => {
        if (cancelled) return
        setState((s) =>
          isCurrent(s)
            ? {
                ...s,
                status: 'ready',
                items: page,
                cursor: page.length > 0 ? cursorOf(page[page.length - 1]) : null,
                hasMore: page.length >= AVAILABLE_PAGE_SIZE,
              }
            : s,
        )
      })
      .catch(() => {
        if (cancelled) return
        setState((s) => (isCurrent(s) ? { ...s, status: 'error' } : s))
      })

    return () => {
      cancelled = true
    }
  }, [filters, reload, presenceReady])

  // Quem entrou na presença depois da carga inicial: busca só esses ids e mescla na lista.
  useEffect(() => {
    if (state.status !== 'ready') return
    const added = [...presence.onlineIds].filter((id) => !knownRef.current.has(id))
    if (added.length === 0) return
    added.forEach((id) => knownRef.current.add(id))
    const isCurrent = (s: AvailableState) => s.filters === filters && s.reload === reload

    fetchAvailablePage(filters, added, null, 50)
      .then((page) => {
        setState((s) => (isCurrent(s) ? { ...s, items: mergeAvailable(s.items, page) } : s))
      })
      .catch(() => {
        added.forEach((id) => knownRef.current.delete(id))
      })
  }, [presence.onlineIds, state.status, filters, reload])

  const loadMore = useCallback(
    async (force = false) => {
      if (fetchingMoreRef.current || state.status !== 'ready' || !state.hasMore) return
      if (state.loadMoreFailed && !force) return
      fetchingMoreRef.current = true
      const isCurrent = (s: AvailableState) => s.filters === filters && s.reload === reload

      setState((s) => (isCurrent(s) ? { ...s, loadingMore: true, loadMoreFailed: false } : s))
      try {
        const page = await fetchAvailablePage(filters, [...onlineRef.current], state.cursor)
        setState((s) =>
          isCurrent(s)
            ? {
                ...s,
                items: mergeAvailable(s.items, page),
                cursor: page.length > 0 ? cursorOf(page[page.length - 1]) : s.cursor,
                hasMore: page.length >= AVAILABLE_PAGE_SIZE,
                loadingMore: false,
              }
            : s,
        )
      } catch {
        setState((s) => (isCurrent(s) ? { ...s, loadingMore: false, loadMoreFailed: true } : s))
      } finally {
        fetchingMoreRef.current = false
      }
    },
    [filters, reload, state.status, state.hasMore, state.cursor, state.loadMoreFailed],
  )

  const retry = useCallback(() => {
    if (presence.status === 'error') presence.retry()
    setReload((n) => n + 1)
  }, [presence])

  // Quem saiu do canal some na hora, mesmo com is_available ainda true no banco.
  const items = state.items.filter((item) => presence.onlineIds.has(item.id))

  return {
    status: presence.status === 'error' ? ('error' as const) : state.status,
    items,
    hasMore: state.hasMore,
    loadingMore: state.loadingMore,
    loadMoreFailed: state.loadMoreFailed,
    loadMore,
    retry,
  }
}
