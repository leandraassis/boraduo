import { focusRing } from './formStyles'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  labelledBy: string
  describedBy?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, labelledBy, describedBy, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-ready bg-ready' : 'border-line-strong bg-field'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-ink shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
