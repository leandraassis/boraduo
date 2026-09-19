import { useRef, useState, type FormEvent } from 'react'
import { REPORT_CATEGORIES, REPORT_DETAILS_MAX, type ReportCategory } from '../../lib/moderation'
import { dangerButtonClass, errorBannerClass, inputClass, optionClass, secondaryButtonClass, smallLabelClass } from '../formStyles'
import { Modal } from '../Modal'

interface ReportUserModalProps {
  username: string
  onSubmit: (category: ReportCategory, details: string) => Promise<void>
  onClose: () => void
}

export function ReportUserModal({ username, onSubmit, onClose }: ReportUserModalProps) {
  const firstOptionRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState<ReportCategory | null>(null)
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!category || sending) return
    setSending(true)
    setFailed(false)
    try {
      await onSubmit(category, details)
    } catch {
      setFailed(true)
      setSending(false)
    }
  }

  return (
    <Modal titleId="report-title" describedById="report-description" onClose={onClose} busy={sending} initialFocusRef={firstOptionRef}>
      <form onSubmit={handleSubmit} noValidate>
        <h2 id="report-title" className="text-lg leading-6 font-semibold tracking-[-0.01em] text-ink">
          Denunciar {username}
        </h2>
        <p id="report-description" className="mt-2 text-sm leading-5 text-ink-muted">
          A moderação analisa cada denúncia. Ao enviar, {username} também é bloqueado: vocês deixam de aparecer um para
          o outro e a conversa vira somente leitura. Só a moderação pode desfazer esse bloqueio.
        </p>

        <fieldset className="mt-5" disabled={sending}>
          <legend className={`${smallLabelClass} mb-2`}>Motivo</legend>
          <div className="space-y-2">
            {REPORT_CATEGORIES.map((option, index) => {
              const selected = category === option.value
              return (
                <label
                  key={option.value}
                  className={`${optionClass(selected)} flex items-center gap-3 px-3.5 py-2.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-match`}
                >
                  <input
                    ref={index === 0 ? firstOptionRef : undefined}
                    type="radio"
                    name="report-category"
                    value={option.value}
                    checked={selected}
                    onChange={() => setCategory(option.value)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-brand' : 'border-line-strong'}`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </span>
                  {option.label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="report-details" className={smallLabelClass}>
              Detalhes <span className="font-normal normal-case">(opcional)</span>
            </label>
            <span className="text-xs text-ink-muted">
              {details.length}/{REPORT_DETAILS_MAX}
            </span>
          </div>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={REPORT_DETAILS_MAX}
            rows={3}
            disabled={sending}
            placeholder="Conte o que aconteceu, se quiser."
            className={`${inputClass} resize-none`}
          />
        </div>

        {failed && (
          <p role="alert" className={`${errorBannerClass} mt-4`}>
            Não foi possível enviar a denúncia. Tente de novo.
          </p>
        )}

        <button type="submit" disabled={!category || sending} className={`${dangerButtonClass} mt-6`}>
          {sending ? 'Enviando...' : 'Enviar denúncia'}
        </button>
        <button type="button" onClick={onClose} disabled={sending} className={`${secondaryButtonClass} mt-2`}>
          Cancelar
        </button>
      </form>
    </Modal>
  )
}
