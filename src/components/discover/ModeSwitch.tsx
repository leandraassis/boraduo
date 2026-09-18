import { focusRing } from '../formStyles'

export type DiscoverMode = 'swipe' | 'available'

const OPTIONS: { value: DiscoverMode; label: string }[] = [
  { value: 'swipe', label: 'Swipe' },
  { value: 'available', label: 'Disponíveis agora' },
]

export function ModeSwitch({ mode, onChange }: { mode: DiscoverMode; onChange: (mode: DiscoverMode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Modo de descoberta"
      className="flex min-w-0 flex-1 rounded-xl border border-line bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === mode
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 cursor-pointer truncate rounded-lg px-3 py-2 text-sm font-semibold transition ${focusRing} ${
              selected ? 'bg-brand text-ink shadow-glow-brand' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
