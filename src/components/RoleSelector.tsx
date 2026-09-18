import { optionClass } from './formStyles'
import { ROLE_INFO, ROLE_VALUES, type RoleType } from '../lib/gameData'
import { RoleIcon } from './RoleIcon'

interface RoleSelectorProps {
  value: RoleType | null
  onChange: (value: RoleType) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Função no jogo">
      {ROLE_VALUES.map((role) => {
        const selected = value === role
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(role)}
            className={`p-3.5 ${optionClass(selected)}`}
          >
            <span className={selected ? 'text-match' : 'text-ink-muted'}>
              <RoleIcon role={role} className="h-5 w-5" />
            </span>
            <span className="mt-2.5 block text-sm font-semibold text-ink">{ROLE_INFO[role].label}</span>
            <span className="mt-0.5 block text-xs leading-4 text-ink-muted">{ROLE_INFO[role].description}</span>
          </button>
        )
      })}
    </div>
  )
}
