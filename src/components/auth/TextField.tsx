import { useState, type ReactNode } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons'
import { focusRing, inputClass, smallLabelClass } from '../formStyles'

interface TextFieldProps {
  id: string
  label: string
  hideLabel?: boolean
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  icon?: ReactNode
  trailing?: ReactNode
  error?: string | null
  autoComplete?: string
  maxLength?: number
}

export function TextField({
  id,
  label,
  hideLabel = false,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  icon,
  trailing,
  error,
  autoComplete,
  maxLength,
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : `mb-1.5 block ${smallLabelClass}`}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputClass} ${icon ? 'pl-11' : ''} ${trailing ? 'pr-12' : ''} ${error ? 'border-danger/60!' : ''}`}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'trailing'>

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:text-ink ${focusRing}`}
        >
          {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      }
    />
  )
}
