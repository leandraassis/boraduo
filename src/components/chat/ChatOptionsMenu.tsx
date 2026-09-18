import { useEffect, useRef, useState } from 'react'
import { focusRing, primaryButtonClass } from '../formStyles'
import { MoreVerticalIcon } from '../icons'

type PlaceholderAction = 'block' | 'report'

const ACTION_COPY: Record<PlaceholderAction, { menu: string; title: string }> = {
  block: { menu: 'Bloquear usuário', title: 'Bloquear usuário' },
  report: { menu: 'Denunciar usuário', title: 'Denunciar usuário' },
}

function PlaceholderModal({
  action,
  username,
  onClose,
}: {
  action: PlaceholderAction
  username: string
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 p-4 backdrop-blur-[20px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-placeholder-title"
        className="w-full max-w-sm rounded-2xl border border-line-strong bg-surface p-6 shadow-glow-brand"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="chat-placeholder-title" className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
          {ACTION_COPY[action].title}
        </h2>
        <p className="mt-2 text-sm leading-5 text-ink-muted">
          Esta ação ainda não está disponível. Em breve você poderá {action === 'block' ? 'bloquear' : 'denunciar'}{' '}
          <strong className="text-ink">{username}</strong> por aqui.
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className={`${primaryButtonClass} mt-6`}>
          Entendi
        </button>
      </div>
    </div>
  )
}

export function ChatOptionsMenu({ username }: { username: string }) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<PlaceholderAction | null>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function choose(next: PlaceholderAction) {
    setOpen(false)
    setAction(next)
  }

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
            {(Object.keys(ACTION_COPY) as PlaceholderAction[]).map((key) => (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={() => choose(key)}
                className={`block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-field ${focusRing} ${
                  key === 'report' ? 'text-danger' : 'text-ink'
                }`}
              >
                {ACTION_COPY[key].menu}
              </button>
            ))}
          </div>
        </>
      )}

      {action && <PlaceholderModal action={action} username={username} onClose={() => setAction(null)} />}
    </div>
  )
}
