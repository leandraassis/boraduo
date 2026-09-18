import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { MESSAGE_MAX_LENGTH } from '../../lib/chat'
import { focusRing, inputClass } from '../formStyles'
import { SendIcon } from '../icons'

const COUNTER_THRESHOLD = MESSAGE_MAX_LENGTH - 200

export function MessageComposer({ onSend }: { onSend: (content: string) => void }) {
  const [draft, setDraft] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const trimmed = draft.trim()

  function resize() {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  function submit() {
    if (!trimmed) return
    onSend(trimmed)
    setDraft('')
    if (areaRef.current) areaRef.current.style.height = 'auto'
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  // Em telas de toque o Enter quebra linha (o botão envia); com mouse/teclado o Enter envia.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    e.preventDefault()
    submit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:p-4"
    >
      <div className="flex items-end gap-2">
        <label htmlFor="message-input" className="sr-only">
          Mensagem
        </label>
        <textarea
          id="message-input"
          ref={areaRef}
          rows={1}
          value={draft}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(e) => {
            setDraft(e.target.value)
            resize()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem"
          className={`${inputClass} max-h-32 min-h-[46px] flex-1 resize-none py-[11px]`}
        />
        <button
          type="submit"
          disabled={!trimmed}
          aria-label="Enviar mensagem"
          className={`flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-linear-to-r from-brand to-match text-ink shadow-glow-brand transition hover:brightness-110 ${focusRing} disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100`}
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
      {draft.length >= COUNTER_THRESHOLD && (
        <p className="mt-1.5 text-right font-mono text-xs text-ink-muted" aria-live="polite">
          {draft.length}/{MESSAGE_MAX_LENGTH}
        </p>
      )}
    </form>
  )
}
