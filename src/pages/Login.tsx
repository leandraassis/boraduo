import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { DuoSampleCard } from '../components/auth/DuoSampleCard'
import { PasswordField, TextField } from '../components/auth/TextField'
import { errorBannerClass, gradientTextClass, primaryButtonClass } from '../components/formStyles'
import { ArrowRightIcon, BoltIcon, LockIcon, MailIcon } from '../components/icons'
import { useSession } from '../hooks/useSession'
import { loginErrorMessage } from '../lib/errors'
import { supabase } from '../lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Login() {
  const navigate = useNavigate()
  const { session, loading: sessionLoading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!sessionLoading && session) {
    return <Navigate to="/app" replace />
  }

  const emailError = !email ? 'Email obrigatório' : !EMAIL_REGEX.test(email) ? 'Email inválido' : null
  const passwordError = !password ? 'Senha obrigatória' : null
  const isValid = !emailError && !passwordError

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!isValid) return

    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setSubmitError(loginErrorMessage(error))
      return
    }

    navigate('/app', { replace: true })
  }

  return (
    <AuthLayout centered>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-16">
        <div className="hidden lg:block">
          <h2 className="text-5xl leading-[1.08] font-bold tracking-[-0.03em] xl:text-[56px]">
            Suba de rank com duos que jogam <span className={gradientTextClass}>sério e sem toxicidade.</span>
          </h2>
          <p className="mt-6 max-w-[520px] text-lg leading-7 text-ink-muted">
            Encontre players alinhados com sua função, seu elo e seus horários de jogo.
          </p>
          <DuoSampleCard className="mt-10 max-w-[560px]" />
        </div>

        <div className="mx-auto w-full max-w-[440px] lg:mx-0 lg:rounded-3xl lg:border lg:border-line lg:bg-surface/80 lg:p-8 lg:backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Bem-vindo de volta, agente</h1>
              <p className="mt-2 text-sm leading-5 text-ink-muted">
                Entre na sua conta para achar seu duo perfeito sem toxicidade.
              </p>
            </div>
            <BoltIcon className="mt-1 h-6 w-6 shrink-0 text-match" />
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
            <TextField
              id="email"
              label="E-mail"
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
              label="Senha"
              value={password}
              onChange={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Sua senha"
              autoComplete="current-password"
              icon={<LockIcon className="h-5 w-5" />}
              error={touched.password ? passwordError : null}
            />

            <p className="-mt-2 text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-match hover:underline">
                Esqueci minha senha
              </Link>
            </p>

            {submitError && (
              <p role="alert" className={errorBannerClass}>
                {submitError}
              </p>
            )}

            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? (
                'Entrando...'
              ) : (
                <>
                  Entrar no BoraDuo
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
            Ainda não tem uma conta?{' '}
            <Link to="/onboarding" className="font-semibold text-match hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
