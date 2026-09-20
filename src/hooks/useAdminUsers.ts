import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAdminUsers, type AdminFilters, type AdminUser, type AdminUsersCursor } from '../lib/admin'

interface AdminUsersState {
  filters: AdminFilters
  attempt: number
  status: 'loading' | 'ready' | 'error'
  users: AdminUser[]
  next: AdminUsersCursor | null
  loadingMore: boolean
  loadMoreFailed: boolean
}

function initialState(filters: AdminFilters, attempt: number): AdminUsersState {
  return { filters, attempt, status: 'loading', users: [], next: null, loadingMore: false, loadMoreFailed: false }
}

// `filters` precisa ser estável entre renders (useMemo): trocar o objeto reinicia a lista, e uma resposta atrasada
// de filtros antigos é descartada.
export function useAdminUsers(filters: AdminFilters) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<AdminUsersState>(() => initialState(filters, 0))
  const loadingMoreRef = useRef(false)

  if (state.filters !== filters || state.attempt !== attempt) {
    setState(initialState(filters, attempt))
  }

  useEffect(() => {
    let cancelled = false
    loadingMoreRef.current = false
    const isCurrent = (s: AdminUsersState) => s.filters === filters && s.attempt === attempt

    fetchAdminUsers(filters, null)
      .then((page) => {
        if (!cancelled) setState((s) => (isCurrent(s) ? { ...s, status: 'ready', users: page.users, next: page.next } : s))
      })
      .catch(() => {
        if (!cancelled) setState((s) => (isCurrent(s) ? { ...s, status: 'error' } : s))
      })
    return () => {
      cancelled = true
    }
  }, [filters, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const next = state.next
  const loadMore = useCallback(async () => {
    if (!next || loadingMoreRef.current) return
    loadingMoreRef.current = true
    const isCurrent = (s: AdminUsersState) => s.filters === filters && s.attempt === attempt
    setState((s) => (isCurrent(s) ? { ...s, loadingMore: true, loadMoreFailed: false } : s))
    try {
      const page = await fetchAdminUsers(filters, next)
      // Um ban/unban feito enquanto a página carrega não é perdido: a linha já em memória ganha do que veio do servidor.
      setState((s) => {
        if (!isCurrent(s)) return s
        const known = new Set(s.users.map((u) => u.id))
        return { ...s, users: [...s.users, ...page.users.filter((u) => !known.has(u.id))], next: page.next, loadingMore: false }
      })
    } catch {
      setState((s) => (isCurrent(s) ? { ...s, loadingMore: false, loadMoreFailed: true } : s))
    } finally {
      loadingMoreRef.current = false
    }
  }, [next, filters, attempt])

  // Banir também marca como revisadas as denúncias pendentes contra o alvo (no servidor), então a contagem zera;
  // desbanir não mexe em denúncias.
  const setBanned = useCallback((userId: string, banned: boolean) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId
          ? { ...u, banned, bannedAt: banned ? new Date().toISOString() : null, pendingReports: banned ? 0 : u.pendingReports }
          : u,
      ),
    }))
  }, [])

  // Descartar uma denúncia individual (sem banir) reduz a contagem em 1, nunca abaixo de 0.
  const decrementPendingReports = useCallback((userId: string) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, pendingReports: Math.max(0, u.pendingReports - 1) } : u)),
    }))
  }, [])

  return {
    status: state.status,
    users: state.users,
    next: state.next,
    loadingMore: state.loadingMore,
    loadMoreFailed: state.loadMoreFailed,
    retry,
    loadMore,
    setBanned,
    decrementPendingReports,
  }
}
