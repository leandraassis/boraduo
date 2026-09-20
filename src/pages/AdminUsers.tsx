import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AdminUserRow } from '../components/admin/AdminUserRow'
import { BanUserModal } from '../components/admin/BanUserModal'
import { SegmentedControl } from '../components/admin/SegmentedControl'
import { focusRing, inputClass } from '../components/formStyles'
import { useToast } from '../contexts/toast'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import {
  ADMIN_SEARCH_MIN_LENGTH,
  banUser,
  isEmailQuery,
  isQueryTooShort,
  shortId,
  unbanUser,
  type AdminFilters,
  type AdminStatusFilter,
  type AdminUser,
} from '../lib/admin'

const STATUS_OPTIONS: { value: AdminStatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativos' },
  { value: 'banned', label: 'Banidos' },
  { value: 'all', label: 'Todos' },
]

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-canvas font-inter text-ink">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-6 pb-12 md:max-w-[640px]">{children}</div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Carregando usuários">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-line" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-line" />
            <div className="h-3 w-16 rounded bg-line" />
          </div>
          <div className="h-8 w-20 rounded-xl bg-line" />
        </div>
      ))}
    </div>
  )
}

function emptyMessage(filters: AdminFilters): string {
  if (filters.query !== '') return isEmailQuery(filters.query) ? 'Nenhuma conta com esse e-mail exato.' : 'Nenhum usuário encontrado.'
  if (filters.onlyReported) return 'Nenhuma denúncia pendente. Use a busca para achar um usuário.'
  return 'Nenhum usuário com esses filtros.'
}

function AdminUsersView() {
  const { showToast } = useToast()
  const [queryInput, setQueryInput] = useState('')
  // Estado inicial = fila de denunciados: a entrada mostra quem precisa de decisão, não a base inteira.
  const [onlyReported, setOnlyReported] = useState(true)
  // null = automático. Escolha manual da aba vale em qualquer modo.
  const [statusChoice, setStatusChoice] = useState<AdminStatusFilter | null>(null)

  const debouncedQuery = useDebouncedValue(queryInput.trim(), 350)
  // Busca curta demais não consulta (o servidor recusa): a lista segue como está e a dica aparece.
  const query = isQueryTooShort(debouncedQuery) ? '' : debouncedQuery
  // A busca substitui a fila. No automático, "Ativos" vale só para a fila (denúncias de quem já foi banido não
  // devem entulhá-la); busca e navegação livre procuram em todos, senão um banido não seria achado para desbanir.
  const queueMode = onlyReported && query === ''
  const status = statusChoice ?? (queueMode ? 'active' : 'all')
  const filters = useMemo<AdminFilters>(() => ({ query, status, onlyReported: queueMode }), [query, status, queueMode])
  const { status: loadStatus, users, next, loadingMore, loadMoreFailed, retry, loadMore, setBanned } = useAdminUsers(filters)

  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [unbanFailed, setUnbanFailed] = useState(false)
  const showTooShortHint = isQueryTooShort(queryInput.trim())

  async function handleBan(user: AdminUser) {
    await banUser(user.id)
    setBanned(user.id, true)
    setBanTarget(null)
    showToast(`${user.username} (#${shortId(user.id)}) foi banido.`)
  }

  async function handleUnban(user: AdminUser) {
    if (pendingId) return
    setPendingId(user.id)
    setUnbanFailed(false)
    try {
      await unbanUser(user.id)
      setBanned(user.id, false)
      showToast(`${user.username} (#${shortId(user.id)}) foi desbanido.`)
    } catch {
      setUnbanFailed(true)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <AdminShell>
      <Link to="/app/profile" className={`inline-flex rounded-lg py-1 text-sm text-ink-muted transition hover:text-ink ${focusRing}`}>
        ← Voltar ao perfil
      </Link>
      <header className="mt-3 mb-4">
        <h1 className="text-2xl leading-8 font-bold tracking-[-0.02em]">Usuários</h1>
        <p className="mt-1 text-sm leading-5 text-ink-muted">
          Comece pela fila de denúncias pendentes ou busque por trecho do username ou e-mail exato.
        </p>
      </header>

      <div className="space-y-3">
        <div>
          <label htmlFor="admin-search" className="sr-only">
            Buscar usuário por username ou e-mail exato
          </label>
          <input
            id="admin-search"
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Username ou e-mail exato"
            autoComplete="off"
            maxLength={254}
            aria-describedby={showTooShortHint ? 'admin-search-hint' : undefined}
            className={inputClass}
          />
          {showTooShortHint && (
            <p id="admin-search-hint" className="mt-1.5 text-xs text-ink-muted">
              Digite ao menos {ADMIN_SEARCH_MIN_LENGTH} caracteres do username, ou um e-mail completo.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[13rem] flex-1">
            <SegmentedControl label="Status da conta" options={STATUS_OPTIONS} value={status} onChange={setStatusChoice} />
          </div>
          <button
            type="button"
            aria-pressed={filters.onlyReported}
            disabled={query !== ''}
            onClick={() => setOnlyReported((on) => !on)}
            title={query !== '' ? 'A busca substitui a fila de denúncias' : undefined}
            className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
              filters.onlyReported ? 'border-danger bg-danger/10 text-danger' : 'border-line-strong bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            Só com denúncias pendentes
          </button>
        </div>
      </div>

      <div className="mt-5">
        {loadStatus === 'loading' && <ListSkeleton />}

        {loadStatus === 'error' && (
          <div role="alert" className="text-sm">
            <p className="text-danger">Não foi possível carregar a lista.</p>
            <button type="button" onClick={retry} className={`mt-2 cursor-pointer text-sm font-medium text-match hover:underline ${focusRing}`}>
              Tentar novamente
            </button>
          </div>
        )}

        {loadStatus === 'ready' && users.length === 0 && <p className="text-sm text-ink-muted">{emptyMessage(filters)}</p>}

        {loadStatus === 'ready' && users.length > 0 && (
          <ul className="space-y-3">
            {users.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                pending={pendingId === user.id}
                disabled={pendingId !== null}
                onBan={setBanTarget}
                onUnban={handleUnban}
              />
            ))}
          </ul>
        )}

        {unbanFailed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Não foi possível desbanir agora. Tente de novo.
          </p>
        )}

        {loadStatus === 'ready' && next && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className={`cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-brand disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
            {loadMoreFailed && (
              <p role="alert" className="text-sm text-danger">
                Não foi possível carregar mais. Tente de novo.
              </p>
            )}
          </div>
        )}
      </div>

      {banTarget && <BanUserModal user={banTarget} onConfirm={() => handleBan(banTarget)} onClose={() => setBanTarget(null)} />}
    </AdminShell>
  )
}

// Só administradores chegam à lista (e só eles disparam a RPC). Qualquer outro perfil é mandado de volta para o
// app antes de qualquer conteúdo da tela ser montado; a RPC recusa quem não é admin de qualquer forma.
export function AdminUsers() {
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading, retry } = useProfile(session?.user.id)

  if (sessionLoading || profileLoading) {
    return (
      <AdminShell>
        <ListSkeleton />
      </AdminShell>
    )
  }

  if (!profile) {
    return (
      <AdminShell>
        <div className="py-16 text-center">
          <p className="text-sm text-ink-muted">Não foi possível carregar esta página.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-brand"
          >
            Tentar novamente
          </button>
        </div>
      </AdminShell>
    )
  }

  if (profile.permission_level !== 'admin') return <Navigate to="/app/discover" replace />

  return <AdminUsersView />
}
