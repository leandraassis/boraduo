import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
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
      setSubmitError(error.message)
      return
    }

    navigate('/app', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-[480px] rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h1 className="mb-6 text-center text-xl font-semibold text-white">Entrar no BoraDuo</h1>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
              placeholder="voce@email.com"
            />
            {touched.email && emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-300">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
              placeholder="Sua senha"
            />
            {touched.password && passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
          </div>

          {submitError && <p className="text-sm text-red-400">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-neutral-400">
            Não tem conta?{' '}
            <Link to="/onboarding" className="text-purple-400 hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
