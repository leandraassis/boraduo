import type { ReactNode } from 'react'
import type { Enums } from '../../types/database'

type RoleType = Enums<'role_type'>

function DuelistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 20 20 4M14 4h6v6M10 20H4v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SentinelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
    </svg>
  )
}

function ControllerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="8" strokeDasharray="4 3" />
    </svg>
  )
}

function InitiatorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

const ROLES: { value: RoleType; label: string; Icon: () => ReactNode }[] = [
  { value: 'duelist', label: 'Duelista', Icon: DuelistIcon },
  { value: 'sentinel', label: 'Sentinela', Icon: SentinelIcon },
  { value: 'controller', label: 'Controlador', Icon: ControllerIcon },
  { value: 'initiator', label: 'Iniciador', Icon: InitiatorIcon },
]

interface RoleSelectorProps {
  value: RoleType | null
  onChange: (value: RoleType) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Função no jogo">
      {ROLES.map(({ value: roleValue, label, Icon }) => {
        const selected = value === roleValue
        return (
          <button
            key={roleValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(roleValue)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
              selected
                ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            <Icon />
            <span className="text-sm font-medium">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
