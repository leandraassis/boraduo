import { Link } from 'react-router-dom'
import { MIN_AGE } from '../../lib/legal'
import { focusRing } from '../formStyles'

interface AcceptTermsCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string | null
  id?: string
}

export function AcceptTermsCheckbox({ checked, onChange, error, id = 'accept-terms' }: AcceptTermsCheckboxProps) {
  const errorId = `${id}-error`
  const linkClass = 'font-medium text-match hover:underline'

  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-ink-muted">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand ${focusRing}`}
        />
        <span>
          Tenho {MIN_AGE} anos ou mais e aceito os{' '}
          <Link to="/termos" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
