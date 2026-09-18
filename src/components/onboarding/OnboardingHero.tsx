import { DuoSampleCard } from '../auth/DuoSampleCard'
import { gradientTextClass, smallLabelClass } from '../formStyles'
import { CheckIcon } from '../icons'
import { ONBOARDING_STEPS } from './steps'

function StepMarker({ position, step }: { position: number; step: number }) {
  if (position < step) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ready/15 text-ready">
        <CheckIcon className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        position === step ? 'bg-brand text-ink' : 'border border-line-strong text-ink-muted'
      }`}
    >
      {position}
    </span>
  )
}

export function OnboardingHero({ step }: { step: number }) {
  const config = ONBOARDING_STEPS[step - 1]

  return (
    <div className="hidden lg:block">
      <h2 className="text-5xl leading-[1.08] font-bold tracking-[-0.03em] xl:text-[56px]">
        {config.hero.before}
        <span className={gradientTextClass}>{config.hero.highlight}</span>
        {config.hero.after}
      </h2>
      <p className="mt-6 max-w-[520px] text-lg leading-7 text-ink-muted">{config.heroText}</p>

      <section className="mt-10 max-w-[560px] rounded-2xl border border-line bg-surface/60 p-5 backdrop-blur">
        <h3 className={`mb-4 ${smallLabelClass}`}>Etapas do cadastro</h3>
        <ol className="grid grid-cols-2 gap-3">
          {ONBOARDING_STEPS.map((item, index) => {
            const position = index + 1
            const current = position === step
            return (
              <li
                key={item.name}
                aria-current={current ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  current ? 'border-brand bg-brand/10' : position < step ? 'border-line bg-field/60' : 'border-line bg-field/40 opacity-60'
                }`}
              >
                <StepMarker position={position} step={step} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className={`truncate text-xs ${current ? 'text-match' : 'text-ink-muted'}`}>
                    {current ? 'Você está aqui' : item.trackerHint}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {step === 1 && <DuoSampleCard className="mt-6 max-w-[560px]" />}
    </div>
  )
}
