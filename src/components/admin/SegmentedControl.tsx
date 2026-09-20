import { focusRing } from '../formStyles'

interface SegmentedControlProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

// Mesmo visual do ModeSwitch da descoberta, mas genérico.
export function SegmentedControl<T extends string>({ label, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex min-w-0 rounded-xl border border-line bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`flex-1 cursor-pointer truncate rounded-lg px-3 py-1.5 text-sm font-semibold transition ${focusRing} ${
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
