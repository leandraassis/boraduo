import { PASSWORD_RULES } from '../../lib/passwordRules'
import { smallLabelClass } from '../formStyles'
import { CheckIcon } from '../icons'

export function PasswordChecklist({ password }: { password: string }) {
  const checks = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))

  return (
    <div className="rounded-xl border border-line bg-field/60 p-4">
      <p className={`mb-3 ${smallLabelClass}`}>Requisitos de segurança</p>
      <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className={`flex items-center gap-2.5 text-sm transition-colors ${check.met ? 'text-ready' : 'text-ink-muted'}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                check.met ? 'border-ready bg-ready/15' : 'border-line-strong'
              }`}
            >
              {check.met && <CheckIcon className="h-3 w-3" />}
            </span>
            <span className="sr-only">{check.met ? 'Atendido: ' : 'Pendente: '}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
