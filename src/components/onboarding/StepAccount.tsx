import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { signUpErrorMessage } from '../../lib/errors'
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES } from '../../lib/passwordRules'
import { supabase } from '../../lib/supabase'
import { PasswordField, TextField } from '../auth/TextField'
import { errorBannerClass, primaryButtonClass, smallLabelClass } from '../formStyles'
import { ArrowRightIcon, CheckIcon, LockIcon, MailIcon } from '../icons'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function StepAccount() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const emailError = !email ? 'Email obrigatório' : !EMAIL_REGEX.test(email) ? 'Email inválido' : null
  const passwordChecks = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))
  const passwordError = !password
    ? 'Senha obrigatória'
    : passwordChecks.some((check) => !check.met)
      ? 'A senha não atende a todos os requisitos'
      : null
  const isValid = !emailError && !passwordError

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!isValid) return

    setSubmitting(true)
    setSubmitError(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (error) {
      setSubmitError(signUpErrorMessage(error))
      return
    }
    if (!data.session) {
      setAwaitingConfirmation(true)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-match/40 bg-match/10 text-match">
          <MailIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">Confirme seu email</h2>
        <p className="mt-2 text-sm leading-5 text-ink-muted">
          Enviamos um link de confirmação para <strong className="text-ink">{email}</strong>. Confirme o email e
          depois entre com sua senha.
        </p>
        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-match hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <TextField
        id="email"
        label="E-mail de acesso"
        type="email"
        value={email}
        onChange={setEmail}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        placeholder="voce@email.com"
        autoComplete="email"
        icon={<MailIcon className="h-5 w-5" />}
        error={touched.email ? emailError : null}
      />

      <PasswordField
        id="password"
        label="Definir senha"
        value={password}
        onChange={setPassword}
        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
        autoComplete="new-password"
        icon={<LockIcon className="h-5 w-5" />}
        error={touched.password ? passwordError : null}
      />

      <div className="rounded-xl border border-line bg-field/60 p-4">
        <p className={`mb-3 ${smallLabelClass}`}>Requisitos de segurança</p>
        <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
          {passwordChecks.map((check) => (
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

      {submitError && (
        <p role="alert" className={errorBannerClass}>
          {submitError}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? (
          'Criando conta...'
        ) : (
          <>
            Criar conta e continuar
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="border-t border-line pt-5 text-center text-sm text-ink-muted">
        Já possui uma conta?{' '}
        <Link to="/login" className="font-semibold text-match hover:underline">
          Entrar no BoraDuo
        </Link>
      </p>
    </form>
  )
}
