import { useRef, useState } from 'react'
import type { AdminUser } from '../../lib/admin'
import { dangerButtonClass, errorBannerClass, secondaryButtonClass } from '../formStyles'
import { Modal } from '../Modal'
import { AdminUserIdentity } from './AdminUserIdentity'

interface BanUserModalProps {
  user: AdminUser
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function BanUserModal({ user, onConfirm, onClose }: BanUserModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleConfirm() {
    setSending(true)
    setFailed(false)
    try {
      await onConfirm()
    } catch {
      setFailed(true)
      setSending(false)
    }
  }

  return (
    <Modal titleId="ban-title" describedById="ban-description" onClose={onClose} busy={sending} initialFocusRef={cancelRef}>
      <h2 id="ban-title" className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
        Banir {user.username}?
      </h2>

      {/* username não é único: a identidade completa evita banir o homônimo errado. */}
      <div data-testid="ban-identity" className="mt-3 rounded-xl border border-line bg-field p-3">
        <AdminUserIdentity user={user} />
        {user.pendingReports > 0 && (
          <p className="mt-1 text-xs font-medium text-danger">
            {user.pendingReports} {user.pendingReports === 1 ? 'denúncia pendente' : 'denúncias pendentes'}
          </p>
        )}
      </div>

      <p id="ban-description" className="mt-3 text-sm leading-5 text-ink-muted">
        A conta perde na hora o acesso ao app e passa a ver só a tela de bloqueio. Você pode desbanir depois, nesta
        mesma tela.
        {user.pendingReports === 1 && ' A denúncia pendente contra esta conta será marcada como revisada.'}
        {user.pendingReports > 1 && ` As ${user.pendingReports} denúncias pendentes contra esta conta serão marcadas como revisadas.`}
      </p>

      {failed && (
        <p role="alert" className={`${errorBannerClass} mt-4`}>
          Não foi possível banir agora. Tente de novo.
        </p>
      )}

      <button type="button" onClick={handleConfirm} disabled={sending} className={`${dangerButtonClass} mt-6`}>
        {sending ? 'Banindo...' : 'Banir'}
      </button>
      <button ref={cancelRef} type="button" onClick={onClose} disabled={sending} className={`${secondaryButtonClass} mt-2`}>
        Cancelar
      </button>
    </Modal>
  )
}
