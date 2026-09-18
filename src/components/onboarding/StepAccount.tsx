import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function StepAccount() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const emailError = !email ? 'Email obrigatório' : !EMAIL_REGEX.test(email) ? 'Email inválido' : null
  const passwordError = !password ? 'Senha obrigatória' : password.length < 6 ? 'Mínimo de 6 caracteres' : null
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
      setSubmitError(error.message)
      return
    }
    if (!data.session) {
      setAwaitingConfirmation(true)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold text-white">Confirme seu email</h2>
        <p className="text-sm text-neutral-400">
          Enviamos um link de confirmação para <strong>{email}</strong>. Confirme o email e depois entre com sua
          senha.
        </p>
        <Link to="/login" className="inline-block text-sm text-purple-400 hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
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
          placeholder="Mínimo de 6 caracteres"
        />
        {touched.password && passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
      </div>

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {submitting ? 'Criando conta...' : 'Criar conta'}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Já tem conta?{' '}
        <Link to="/login" className="text-purple-400 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
