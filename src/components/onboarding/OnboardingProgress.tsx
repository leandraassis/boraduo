const TOTAL_STEPS = 4

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition ${
              s <= step ? 'bg-purple-500' : 'bg-neutral-800'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-neutral-500">
        Passo {step} de {TOTAL_STEPS}
      </p>
    </div>
  )
}
