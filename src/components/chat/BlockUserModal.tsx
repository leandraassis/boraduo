import { useRef, useState } from 'react'
import { dangerButtonClass, errorBannerClass, secondaryButtonClass } from '../formStyles'
import { Modal } from '../Modal'

interface BlockUserModalProps {
  username: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function BlockUserModal({ username, onConfirm, onClose }: BlockUserModalProps) {
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
    <Modal titleId="block-title" describedById="block-description" onClose={onClose} busy={sending} initialFocusRef={cancelRef}>
      <h2 id="block-title" className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
        Bloquear {username}?
      </h2>
      <p id="block-description" className="mt-2 text-sm leading-5 text-ink-muted">
        Vocês deixam de aparecer um para o outro e a conversa vira somente leitura, com o histórico preservado. Você
        pode desbloquear depois em Perfil, na seção de usuários bloqueados.
      </p>

      {failed && (
        <p role="alert" className={`${errorBannerClass} mt-4`}>
          Não foi possível bloquear agora. Tente de novo.
        </p>
      )}

      <button type="button" onClick={handleConfirm} disabled={sending} className={`${dangerButtonClass} mt-6`}>
        {sending ? 'Bloqueando...' : 'Bloquear'}
      </button>
      <button ref={cancelRef} type="button" onClick={onClose} disabled={sending} className={`${secondaryButtonClass} mt-2`}>
        Cancelar
      </button>
    </Modal>
  )
}
