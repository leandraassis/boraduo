import { useEffect, useRef } from 'react'

interface AvailabilityWarningModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function AvailabilityWarningModal({ onConfirm, onCancel }: AvailabilityWarningModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/85 p-4 backdrop-blur-[20px]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-warning-title"
        aria-describedby="availability-warning-description"
        className="w-full max-w-sm rounded-2xl border border-line-strong bg-surface p-6 shadow-glow-brand"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-ready/40 bg-ready/10 text-ready">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </div>

        <h2 id="availability-warning-title" className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
          Antes de ativar
        </h2>
        <p id="availability-warning-description" className="mt-2 text-sm leading-5 text-ink-muted">
          Qualquer jogador disponível pode te chamar direto, sem pedir aceite antes.
        </p>

        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          className="mt-6 w-full cursor-pointer rounded-xl bg-linear-to-r from-brand to-match py-3 text-sm font-semibold text-ink shadow-glow-brand transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match"
        >
          Entendi
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 w-full cursor-pointer py-2 text-xs text-ink-muted transition hover:text-ink"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
