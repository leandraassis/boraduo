import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { PasswordChecklist } from '../components/auth/PasswordChecklist'
import { PasswordField } from '../components/auth/TextField'
import { errorBannerClass, primaryButtonClass, textButtonClass } from '../components/formStyles'
import { ArrowLeftIcon, CheckIcon, LockIcon } from '../components/icons'
import { ScreenSkeleton } from '../components/ScreenStates'
import { useSession } from '../hooks/useSession'
import { isSessionMissingError, updatePasswordErrorMessage } from '../lib/errors'
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES } from '../lib/passwordRules'
import { supabase } from '../lib/supabase'

type LinkProblem = 'expired' | 'invalid'

// Quando o link do e-mail não vale mais, o Supabase redireciona com o motivo no hash (#error_code=otp_expired&...).
function readLinkProblem(): LinkProblem | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const code = hash.get('error_code') ?? query.get('error_code')
  const error = hash.get('error') ?? query.get('error')
  if (!code && !error) return null
  return code === 'otp_expired' ? 'expired' : 'invalid'
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayout centered>
      <div className="mx-auto w-full max-w-[440px] lg:rounded-3xl lg:border lg:border-line lg:bg-surface/80 lg:p-8 lg:backdrop-blur">
        {children}
      </div>
    </AuthLayout>
  )
}

function InvalidLink({ problem }: { problem: LinkProblem | 'no-session' }) {
  return (
    <Card>
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-danger/40 bg-danger/10 text-danger">
          <LockIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[28px] leading-9 font-bold tracking-[-0.02em]">Link inválido ou expirado</h1>
        <p className="mt-2 text-sm leading-5 text-ink-muted">
          {problem === 'expired'
            ? 'Este link de recuperação expirou. Peça um novo para criar sua senha.'
            : 'Este link de recuperação não é válido ou já foi usado. Peça um novo para criar sua senha.'}
        </p>
        <Link to="/forgot-password" className={`${primaryButtonClass} mt-6`}>
          Pedir novo link
        </Link>
        <p className="mt-6 border-t border-line pt-5">
          <Link to="/login" className={textButtonClass}>
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar ao login
          </Link>
        </p>
      </div>
    </Card>
  )
}

export function ResetPassword() {
  const { session, loading } = useSession()
  // Lido uma vez, no primeiro render: o supabase-js limpa o hash depois de processar um link válido.
  const [linkProblem] = useState(readLinkProblem)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sessionLost, setSessionLost] = useState(false)
  const [done, setDone] = useState(false)

  if (loading) return <ScreenSkeleton />
  if (done) {
    return (
      <Card>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-ready/40 bg-ready/10 text-ready">
            <CheckIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[28px] leading-9 font-bold tracking-[-0.02em]">Senha alterada</h1>
          <p className="mt-2 text-sm leading-5 text-ink-muted">
            Sua nova senha já vale e você está conectado. Os outros dispositivos foram desconectados.
          </p>
          <Link to="/app" replace className={`${primaryButtonClass} mt-6`}>
            Continuar para o app
          </Link>
        </div>
      </Card>
    )
  }
  if (linkProblem) return <InvalidLink problem={linkProblem} />
  if (!session || sessionLost) return <InvalidLink problem="no-session" />

  const passwordError = !password
    ? 'Senha obrigatória'
    : PASSWORD_RULES.some((rule) => !rule.test(password))
      ? 'A senha não atende a todos os requisitos'
      : null
  const confirmError = !confirm ? 'Confirme a nova senha' : confirm !== password ? 'As senhas não conferem' : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (passwordError || confirmError || submitting) return

    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setSubmitting(false)
      if (isSessionMissingError(error)) setSessionLost(true)
      else setSubmitError(updatePasswordErrorMessage(error))
      return
    }

    // Senha trocada por quem provou ter o e-mail: derruba as demais sessões (dispositivos) da conta. Falha aqui
    // não desfaz a troca, então não bloqueia a conclusão.
    await supabase.auth.signOut({ scope: 'others' }).catch(() => undefined)
    setSubmitting(false)
    setDone(true)
  }

  return (
    <Card>
      <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Definir nova senha</h1>
      <p className="mt-2 text-sm leading-5 text-ink-muted">Escolha uma senha nova para a sua conta.</p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="new-password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
          autoComplete="new-password"
          icon={<LockIcon className="h-5 w-5" />}
          error={touched.password ? passwordError : null}
        />

        <PasswordChecklist password={password} />

        <PasswordField
          id="confirm-password"
          label="Confirmar nova senha"
          value={confirm}
          onChange={setConfirm}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          placeholder="Repita a senha"
          autoComplete="new-password"
          icon={<LockIcon className="h-5 w-5" />}
          error={touched.confirm ? confirmError : null}
        />

        {submitError && (
          <p role="alert" className={errorBannerClass}>
            {submitError}
          </p>
        )}

        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {submitting ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </form>
    </Card>
  )
}
