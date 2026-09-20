import { useState } from 'react'
import { shortId, type AdminUser } from '../../lib/admin'
import { Avatar } from '../Avatar'
import { focusRing } from '../formStyles'
import { AdminUserIdentity } from './AdminUserIdentity'
import { UserReportsPanel } from './UserReportsPanel'

interface AdminUserRowProps {
  user: AdminUser
  pending: boolean
  disabled: boolean
  onBan: (user: AdminUser) => void
  onUnban: (user: AdminUser) => void
}

export function AdminUserRow({ user, pending, disabled, onBan, onUnban }: AdminUserRowProps) {
  const [reportsOpen, setReportsOpen] = useState(false)
  const panelId = `reports-${user.id}`
  const actionClass = `shrink-0 cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

  return (
    <li
      data-testid="admin-user-row"
      data-username={user.username}
      data-user-id={user.id}
      data-banned={user.banned ? 'true' : 'false'}
      className="rounded-2xl border border-line bg-surface p-3"
    >
      <div className="flex items-center gap-3">
        <Avatar url={user.avatarUrl} name={user.username} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <AdminUserIdentity user={user} showStatus />
        </div>

        {/* Admin não é banível (a RPC também recusa): nenhuma ação é oferecida nessa linha. */}
        {!user.isAdmin &&
          (user.banned ? (
            <button
              type="button"
              onClick={() => onUnban(user)}
              disabled={disabled}
              aria-label={`Desbanir ${user.username} (#${shortId(user.id)})`}
              className={`${actionClass} border-line-strong bg-field text-ink hover:border-ready`}
            >
              {pending ? 'Desbanindo...' : 'Desbanir'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBan(user)}
              disabled={disabled}
              aria-label={`Banir ${user.username} (#${shortId(user.id)})`}
              className={`${actionClass} border-line-strong bg-field text-ink hover:border-danger hover:text-danger`}
            >
              Banir
            </button>
          ))}
      </div>

      <button
        type="button"
        onClick={() => setReportsOpen((open) => !open)}
        aria-expanded={reportsOpen}
        aria-controls={reportsOpen ? panelId : undefined}
        className={`mt-2 ml-[52px] cursor-pointer rounded-md text-xs font-medium hover:underline ${focusRing} ${
          user.pendingReports > 0 ? 'text-danger' : 'text-ink-muted'
        }`}
      >
        {user.pendingReports > 0
          ? `${user.pendingReports} ${user.pendingReports === 1 ? 'denúncia pendente' : 'denúncias pendentes'}`
          : 'Ver denúncias'}
        <span aria-hidden="true">{reportsOpen ? ' ▴' : ' ▾'}</span>
      </button>

      {/* A chave recarrega o painel quando o ban muda o status das denúncias (pendentes viram revisadas). */}
      {reportsOpen && <UserReportsPanel key={user.banned ? 'banned' : 'active'} id={panelId} userId={user.id} />}
    </li>
  )
}
