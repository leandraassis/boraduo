import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from './steps'

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3 text-[11px] leading-4 font-semibold tracking-[0.04em] uppercase">
        <span className="flex items-center gap-2 text-match">
          <span className="h-1.5 w-1.5 rounded-full bg-match" aria-hidden="true" />
          Passo {step} de {TOTAL_ONBOARDING_STEPS}
        </span>
        <span className="text-right text-ink-muted">{ONBOARDING_STEPS[step - 1].name}</span>
      </div>

      <div
        className="flex gap-2"
        role="progressbar"
        aria-label="Progresso do cadastro"
        aria-valuemin={1}
        aria-valuemax={TOTAL_ONBOARDING_STEPS}
        aria-valuenow={step}
      >
        {ONBOARDING_STEPS.map((config, index) => {
          const position = index + 1
          const tone =
            position < step ? 'bg-brand' : position === step ? 'bg-linear-to-r from-brand to-match' : 'bg-line'
          return <div key={config.name} className={`h-1.5 flex-1 rounded-full transition-colors ${tone}`} />
        })}
      </div>
    </div>
  )
}
