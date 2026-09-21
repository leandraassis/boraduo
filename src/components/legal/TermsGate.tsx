import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { acceptTermsErrorMessage } from '../../lib/errors'
import { TERMS_VERSION } from '../../lib/legal'
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'
import { AuthLayout } from '../auth/AuthLayout'
import { errorBannerClass, primaryButtonClass, secondaryButtonClass } from '../formStyles'
import { AcceptTermsCheckbox } from './AcceptTermsCheckbox'

interface TermsGateProps {
  profile: Tables<'profiles'>
  onAccepted: (profile: Tables<'profiles'>) => void
}

export function TermsGate({ profile, onAccepted }: TermsGateProps) {
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState(false)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const updated = profile.terms_version !== null

  async function handleAccept() {
    setTouched(true)
    if (!accepted || submitting) return

    setSubmitting(true)
    setError(null)
    // O horário do aceite é do servidor (trigger); o cliente só informa a versão.
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ terms_version: TERMS_VERSION })
      .eq('id', profile.id)
      .select()
      .single()
    setSubmitting(false)

    if (updateError || !data) {
      setError(acceptTermsErrorMessage(updateError ?? {}))
      return
    }
    onAccepted(data)
  }

  async function handleLeave() {
    setLeaving(true)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setLeaving(false)
      setError('Não foi possível encerrar a sessão. Tente novamente.')
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout centered>
      <div className="mx-auto w-full max-w-[440px] lg:rounded-3xl lg:border lg:border-line lg:bg-surface/80 lg:p-8 lg:backdrop-blur">
        <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">
          {updated ? 'Atualizamos nossos Termos' : 'Antes de continuar'}
        </h1>
        <p className="mt-2 text-sm leading-5 text-ink-muted">
          {updated
            ? 'Publicamos uma nova versão dos Termos de Uso e da Política de Privacidade. Para continuar usando o BoraDuo, leia e aceite.'
            : 'Para continuar usando o BoraDuo, leia e aceite os Termos de Uso e a Política de Privacidade.'}
        </p>

        <div className="mt-6">
          <AcceptTermsCheckbox
            checked={accepted}
            onChange={setAccepted}
            error={touched && !accepted ? 'Aceite os Termos e a Política para continuar' : null}
          />
        </div>

        {error && (
          <p role="alert" className={`${errorBannerClass} mt-5`}>
            {error}
          </p>
        )}

        <button type="button" onClick={handleAccept} disabled={submitting || leaving} className={`${primaryButtonClass} mt-6`}>
          {submitting ? 'Registrando...' : 'Aceitar e continuar'}
        </button>
        <button type="button" onClick={handleLeave} disabled={submitting || leaving} className={`${secondaryButtonClass} mt-2`}>
          {leaving ? 'Saindo...' : 'Não aceito, sair da conta'}
        </button>
      </div>
    </AuthLayout>
  )
}
