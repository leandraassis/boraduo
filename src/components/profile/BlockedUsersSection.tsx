import { useState } from 'react'
import { useToast } from '../../contexts/toast'
import { useBlockedUsers } from '../../hooks/useBlockedUsers'
import { RANK_INFO } from '../../lib/gameData'
import { unblockUser, type BlockedUser } from '../../lib/moderation'
import { Avatar } from '../Avatar'
import { focusRing } from '../formStyles'

function BlockedSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Carregando usuários bloqueados">
      {[0, 1].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-line" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-line" />
            <div className="h-3 w-16 rounded bg-line" />
          </div>
          <div className="h-8 w-24 rounded-xl bg-line" />
        </div>
      ))}
    </div>
  )
}

interface BlockedRowProps {
  blocked: BlockedUser
  pending: boolean
  disabled: boolean
  onUnblock: (blocked: BlockedUser) => void
}

function BlockedRow({ blocked, pending, disabled, onUnblock }: BlockedRowProps) {
  const { other, reversible } = blocked
  return (
    <li data-testid="blocked-user" data-reversible={reversible ? 'true' : 'false'} className="flex items-center gap-3">
      <Avatar url={other.avatarUrl} name={other.username} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{other.username}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_INFO[other.rank].color }} aria-hidden="true" />
          {RANK_INFO[other.rank].label}
        </p>
      </div>

      {reversible ? (
        <button
          type="button"
          onClick={() => onUnblock(blocked)}
          disabled={disabled}
          aria-label={`Desbloquear ${other.username}`}
          className={`shrink-0 cursor-pointer rounded-xl border border-line-strong bg-field px-3.5 py-2 text-sm font-medium whitespace-nowrap text-ink transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          {pending ? 'Desbloqueando...' : 'Desbloquear'}
        </button>
      ) : (
        // Bloqueio nascido de denúncia: só a moderação remove, então nenhuma ação é oferecida.
        <span className="max-w-[9.5rem] shrink-0 text-right text-xs leading-4 text-ink-muted">
          <span className="font-semibold text-danger">Denúncia</span>
          <br />
          Só a moderação remove
        </span>
      )}
    </li>
  )
}

export function BlockedUsersSection() {
  const { showToast } = useToast()
  const { status, items, retry, removeLocally } = useBlockedUsers()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function handleUnblock(blocked: BlockedUser) {
    if (pendingId) return
    setPendingId(blocked.blockId)
    setFailed(false)
    try {
      await unblockUser(blocked.blockId)
      removeLocally(blocked.blockId)
      showToast(`${blocked.other.username} foi desbloqueado.`)
    } catch {
      setFailed(true)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section aria-labelledby="blocked-title" className="order-5 rounded-2xl border border-line bg-surface p-4 sm:p-5 md:order-none">
      <h2 id="blocked-title" className="text-sm font-semibold text-ink">
        Usuários bloqueados
      </h2>
      <p className="mt-1 text-xs leading-4 text-ink-muted">
        Quem você bloqueia não aparece para você, e você não aparece para essa pessoa.
      </p>

      <div className="mt-4">
        {status === 'loading' && <BlockedSkeleton />}

        {status === 'error' && (
          <div role="alert" className="text-sm">
            <p className="text-danger">Não foi possível carregar a lista.</p>
            <button type="button" onClick={retry} className={`mt-2 cursor-pointer text-sm font-medium text-match hover:underline ${focusRing}`}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && <p className="text-sm text-ink-muted">Você não bloqueou ninguém.</p>}

        {status === 'ready' && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((blocked) => (
              <BlockedRow
                key={blocked.blockId}
                blocked={blocked}
                pending={pendingId === blocked.blockId}
                disabled={pendingId !== null}
                onUnblock={handleUnblock}
              />
            ))}
          </ul>
        )}

        {failed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Não foi possível desbloquear agora. Tente de novo.
          </p>
        )}
      </div>
    </section>
  )
}
