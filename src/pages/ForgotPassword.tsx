import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { TextField } from '../components/auth/TextField'
import { errorBannerClass, primaryButtonClass, textButtonClass } from '../components/formStyles'
import { ArrowLeftIcon, ArrowRightIcon, MailIcon } from '../components/icons'
import { resetRequestErrorMessage } from '../lib/errors'
import { supabase } from '../lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// O Supabase também limita o reenvio por e-mail; esperar aqui evita cair no erro dele.
const RESEND_COOLDOWN_SECONDS = 60

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const trimmed = email.trim()
  const emailError = !trimmed ? 'Email obrigatório' : !EMAIL_REGEX.test(trimmed) ? 'Email inválido' : null

  async function sendLink(address: string) {
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (error) {
      setSubmitError(resetRequestErrorMessage(error))
      return
    }
    setSentTo(address)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (emailError || submitting) return
    void sendLink(trimmed)
  }

  return (
    <AuthLayout centered>
      <div className="mx-auto w-full max-w-[440px] lg:rounded-3xl lg:border lg:border-line lg:bg-surface/80 lg:p-8 lg:backdrop-blur">
        {sentTo ? (
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-match/40 bg-match/10 text-match">
              <MailIcon className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-[28px] leading-9 font-bold tracking-[-0.02em]">Verifique seu e-mail</h1>
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Se existir uma conta com <strong className="break-all text-ink">{sentTo}</strong>, enviamos um link para
              redefinir a senha. O link vale por tempo limitado; confira também a caixa de spam.
            </p>

            {submitError && (
              <p role="alert" className={`${errorBannerClass} mt-5 text-left`}>
                {submitError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void sendLink(sentTo)}
              disabled={submitting || cooldown > 0}
              className={`${primaryButtonClass} mt-6`}
            >
              {submitting ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSentTo(null)
                setSubmitError(null)
              }}
              className={`${textButtonClass} mt-3`}
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Recuperar senha</h1>
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
              <TextField
                id="email"
                label="E-mail"
                type="email"
                value={email}
                onChange={setEmail}
                onBlur={() => setTouched(true)}
                placeholder="voce@email.com"
                autoComplete="email"
                icon={<MailIcon className="h-5 w-5" />}
                error={touched ? emailError : null}
              />

              {submitError && (
                <p role="alert" className={errorBannerClass}>
                  {submitError}
                </p>
              )}

              <button type="submit" disabled={submitting} className={primaryButtonClass}>
                {submitting ? (
                  'Enviando...'
                ) : (
                  <>
                    Enviar link de recuperação
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 border-t border-line pt-5 text-center">
          <Link to="/login" className={textButtonClass}>
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar ao login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
