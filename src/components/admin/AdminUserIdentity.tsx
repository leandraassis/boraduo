import { useAgents } from '../../hooks/useAgents'
import { shortId, type AdminUser } from '../../lib/admin'
import { RANK_INFO, ROLE_INFO } from '../../lib/gameData'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

interface AdminUserIdentityProps {
  user: AdminUser
  showStatus?: boolean
}

// username não é único: além do nome, mostra o id curto, função, rank, agente e a data de cadastro para o admin
// distinguir homônimos (na linha e na confirmação de banimento).
export function AdminUserIdentity({ user, showStatus = false }: AdminUserIdentityProps) {
  const { byId } = useAgents()
  const agentName = byId.get(user.mainAgentId)?.name ?? user.mainAgentId

  return (
    <div className="min-w-0">
      <p className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-sm font-semibold text-ink">{user.username}</span>
        <span className="shrink-0 font-mono text-xs text-ink-muted">#{shortId(user.id)}</span>
      </p>

      {showStatus && (
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={user.banned ? 'font-semibold text-danger' : 'text-ready'}>{user.banned ? 'Banido' : 'Ativo'}</span>
          {user.isAdmin && (
            <span className="rounded-md bg-brand/20 px-1.5 py-0.5 text-[10px] leading-3 font-semibold tracking-[0.04em] text-ink uppercase">
              Admin
            </span>
          )}
        </p>
      )}

      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
        <span>{ROLE_INFO[user.role].label}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_INFO[user.rank].color }} aria-hidden="true" />
          {RANK_INFO[user.rank].label}
        </span>
        <span aria-hidden="true">·</span>
        <span>{agentName}</span>
      </p>

      <p className="mt-0.5 text-xs text-ink-muted">
        Cadastro em {dateFormat.format(new Date(user.createdAt))}
        {user.email && (
          <>
            {' · '}
            <span className="break-all">{user.email}</span>
          </>
        )}
      </p>
    </div>
  )
}
