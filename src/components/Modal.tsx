import { useEffect, type ReactNode, type RefObject } from 'react'

interface ModalProps {
  titleId: string
  describedById?: string
  onClose: () => void
  // Enquanto uma ação está em andamento, Esc e clique fora não fecham.
  busy?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function Modal({ titleId, describedById, onClose, busy = false, initialFocusRef, children }: ModalProps) {
  useEffect(() => {
    initialFocusRef?.current?.focus()
  }, [initialFocusRef])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, busy])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-canvas/85 p-4 backdrop-blur-[20px]"
      onClick={() => {
        if (!busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        className="my-auto w-full max-w-sm rounded-2xl border border-line-strong bg-surface p-6 shadow-glow-brand"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
