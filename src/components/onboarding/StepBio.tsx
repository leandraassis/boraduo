import { BIO_MAX_LENGTH } from '../../lib/profileLimits'
import { FormSection } from '../FormSection'
import { errorBannerClass, focusRing, inputClass, primaryButtonClass, smallLabelClass, textButtonClass } from '../formStyles'
import { ArrowLeftIcon, ArrowRightIcon } from '../icons'

interface StepBioProps {
  bio: string
  onBioChange: (value: string) => void
  onFinish: (bio: string | null) => void
  onBack: () => void
  submitting: boolean
  error: string | null
}

export function StepBio({ bio, onBioChange, onFinish, onBack, submitting, error }: StepBioProps) {
  return (
    <div className="space-y-4">
      <FormSection title="Bio tática" aside="Opcional">
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="bio" className={smallLabelClass}>
            Sua bio
          </label>
          <span className="font-mono text-xs text-ink-muted" aria-live="polite">
            {bio.length}/{BIO_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="bio"
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          onChange={(e) => onBioChange(e.target.value.slice(0, BIO_MAX_LENGTH))}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Ex: Foco em subir de rank. Call limpa, sem rage."
        />
      </FormSection>

      {error && (
        <p role="alert" className={errorBannerClass}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => onFinish(bio.trim() || null)}
        disabled={submitting}
        className={primaryButtonClass}
      >
        {submitting ? (
          'Concluindo...'
        ) : (
          <>
            Concluir cadastro
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>

      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onBack} disabled={submitting} className={textButtonClass}>
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar ao passo anterior
        </button>
        <button
          type="button"
          onClick={() => onFinish(null)}
          disabled={submitting}
          className={`cursor-pointer rounded-lg py-1 text-sm font-medium text-match hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          Pular bio e finalizar
        </button>
      </div>
    </div>
  )
}
