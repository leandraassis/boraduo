import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { focusRing } from '../components/formStyles'
import { LockIcon } from '../components/icons'
import { ScreenError, ScreenSkeleton } from '../components/ScreenStates'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabase'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

// Tela de bloqueio total: substitui toda a navegação (fica fora do AppShell, sem bottom nav) e é a única
// coisa que uma conta banida enxerga — a RLS só deixa ela ler o próprio perfil.
export function Banned() {
  const { session, loading: sessionLoading } = useSession()
  const navigate = useNavigate()
  const userId = session?.user.id
  const { profile, loading, error, setProfile, retry } = useProfile(userId)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)

  // Se a moderação reverter o banimento, a tela libera o acesso ao voltar ao foco.
  useEffect(() => {
    if (!userId) return
    function recheck() {
      if (document.visibilityState !== 'visible') return
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data)
        })
    }
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [userId, setProfile])

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(false)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLoggingOut(false)
      setLogoutError(true)
      return
    }
    navigate('/login', { replace: true })
  }

  // Sem esperar a sessão o perfil viria nulo no 1º render e a página redirecionaria para o onboarding.
  if (sessionLoading || loading) return <ScreenSkeleton />
  if (!session) return <Navigate to="/login" replace />
  if (error) return <ScreenError title="Não foi possível carregar sua conta" onRetry={retry} />
  if (!profile) return <Navigate to="/onboarding" replace />
  if (profile.status !== 'banned') return <Navigate to="/app/discover" replace />

  return (
    <AuthLayout centered>
      <section
        role="alert"
        aria-labelledby="banned-title"
        className="mx-auto w-full max-w-md rounded-3xl border border-danger/30 bg-surface/80 p-6 text-center shadow-glow-danger backdrop-blur sm:p-8"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/40 bg-danger/10 text-danger">
          <LockIcon className="h-7 w-7" />
        </span>

        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-danger uppercase">
          Status da conta: banida
        </p>
        <h1 id="banned-title" className="mt-4 text-2xl leading-8 font-bold tracking-[-0.02em] text-ink">
          Sua conta foi banida
        </h1>
        <p className="mt-3 text-sm leading-5 text-ink-muted">
          Com esta conta você não pode mais usar o BoraDuo: descoberta de jogadores, conversas e disponibilidade estão
          bloqueadas.
          {profile.banned_at && <> O banimento foi aplicado em {dateFormat.format(new Date(profile.banned_at))}.</>}
        </p>
        <p className="mt-3 text-sm leading-5 text-ink-muted">
          Se você acredita que isso foi um engano, fale com a equipe do BoraDuo.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`mt-7 w-full cursor-pointer rounded-xl border border-line-strong bg-field px-4 py-3 text-sm font-medium text-ink transition hover:border-danger hover:text-danger disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
        >
          {loggingOut ? 'Saindo...' : 'Sair da conta'}
        </button>
        {logoutError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Não foi possível encerrar a sessão. Tente novamente.
          </p>
        )}
      </section>
    </AuthLayout>
  )
}
