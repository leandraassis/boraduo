import { useEffect, useState } from 'react'
import { blockUser, reportUser, type ReportCategory } from '../../lib/moderation'
import { focusRing } from '../formStyles'
import { MoreVerticalIcon } from '../icons'
import { BlockUserModal } from './BlockUserModal'
import { ReportUserModal } from './ReportUserModal'

type Action = 'block' | 'report'

interface ChatOptionsMenuProps {
  username: string
  otherId: string
  // Conversa já encerrada (bloqueio ou banimento): bloquear de novo não faria nada.
  readOnly: boolean
  onModerated: (kind: 'blocked' | 'reported') => void
}

export function ChatOptionsMenu({ username, otherId, readOnly, onModerated }: ChatOptionsMenuProps) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<Action | null>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function choose(next: Action) {
    setOpen(false)
    setAction(next)
  }

  async function confirmBlock() {
    await blockUser(otherId)
    setAction(null)
    onModerated('blocked')
  }

  async function submitReport(category: ReportCategory, details: string) {
    await reportUser(otherId, category, details)
    setAction(null)
    onModerated('reported')
  }

  const items: { key: Action; label: string; danger: boolean }[] = [
    ...(readOnly ? [] : [{ key: 'block' as const, label: 'Bloquear usuário', danger: false }]),
    { key: 'report', label: 'Denunciar usuário', danger: true },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opções da conversa"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-surface text-ink-muted transition hover:text-ink ${focusRing}`}
      >
        <MoreVerticalIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label="Opções da conversa"
            className="absolute top-full right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-line-strong bg-surface p-1 shadow-2xl"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => choose(item.key)}
                className={`block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-field ${focusRing} ${
                  item.danger ? 'text-danger' : 'text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {action === 'block' && <BlockUserModal username={username} onConfirm={confirmBlock} onClose={() => setAction(null)} />}
      {action === 'report' && (
        <ReportUserModal username={username} onSubmit={submitReport} onClose={() => setAction(null)} />
      )}
    </div>
  )
}
