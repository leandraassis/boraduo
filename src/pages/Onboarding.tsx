import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/auth/AuthLayout'
import { BoltIcon } from '../components/icons'
import { ScreenError } from '../components/ScreenStates'
import { OnboardingHero } from '../components/onboarding/OnboardingHero'
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress'
import { StepAccount } from '../components/onboarding/StepAccount'
import { StepBio } from '../components/onboarding/StepBio'
import { StepGameProfile } from '../components/onboarding/StepGameProfile'
import { StepIdentity } from '../components/onboarding/StepIdentity'
import { ONBOARDING_STEPS } from '../components/onboarding/steps'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { uploadAvatar, type StagedAvatar } from '../lib/avatar'
import { createProfileErrorMessage, isUsernameTakenError } from '../lib/errors'
import type { RankType, RoleType } from '../lib/gameData'
import { supabase } from '../lib/supabase'

interface OnboardingData {
  username: string
  avatar: StagedAvatar | null
  role: RoleType | null
  // Vira true quando o jogador escolhe a função à mão; a partir daí trocar o agente não a sobrescreve.
  roleTouched: boolean
  mainAgentId: string | null
  rank: RankType | null
  bio: string
}

const INITIAL_DATA: OnboardingData = {
  username: '',
  avatar: null,
  role: null,
  roleTouched: false,
  mainAgentId: null,
  rank: null,
  bio: '',
}

export function Onboarding() {
  const navigate = useNavigate()
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading, error: profileError, retry } = useProfile(session?.user.id)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [usernameConflict, setUsernameConflict] = useState<string | null>(null)

  if (session && step === 1) {
    setStep(2)
  }

  if (!sessionLoading && session && !profileLoading && profile) {
    return <Navigate to="/app" replace />
  }

  // Sem saber se o perfil já existe não dá para continuar: criar de novo colidiria com o existente.
  if (session && profileError) {
    return <ScreenError title="Não foi possível verificar sua conta" onRetry={retry} />
  }

  async function finishOnboarding(bio: string | null) {
    if (!session || !data.role || !data.rank || !data.mainAgentId) return

    setSubmitting(true)
    setSubmitError(null)

    let avatarUrl: string | null = null
    if (data.avatar) {
      try {
        avatarUrl = await uploadAvatar(session.user.id, data.avatar.file, data.avatar.mime)
      } catch {
        setSubmitting(false)
        setSubmitError('Não foi possível enviar sua foto. Tente novamente.')
        return
      }
    }

    const { error } = await supabase.from('profiles').insert({
      id: session.user.id,
      username: data.username.trim(),
      avatar_url: avatarUrl,
      bio,
      role: data.role,
      main_agent_id: data.mainAgentId,
      rank: data.rank,
    })

    setSubmitting(false)

    if (error) {
      // Riot ID já usado por outra conta: o insert falhou de verdade (diferente do caso abaixo).
      // Volta pra etapa 2 com o erro visível ali, mantendo agente/rank/bio já preenchidos.
      if (isUsernameTakenError(error)) {
        setStep(2)
        setUsernameConflict('Esse Riot ID já está cadastrado. Escolha outro.')
        return
      }
      // 23505 na PK (id): reenvio duplicado do mesmo perfil (ex.: duplo clique) — já foi criado.
      if (error.code !== '23505') {
        setSubmitError(createProfileErrorMessage(error))
        return
      }
    }

    navigate('/app', { replace: true })
  }

  const config = ONBOARDING_STEPS[step - 1]

  return (
    <AuthLayout>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_540px] lg:items-start lg:gap-16 lg:pt-2">
        <OnboardingHero step={step} />

        <div className="mx-auto w-full max-w-[540px] lg:mx-0 lg:rounded-3xl lg:border lg:border-line lg:bg-surface/70 lg:p-8 lg:backdrop-blur">
          <OnboardingProgress step={step} />

          <div className="mt-7 mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">{config.title}</h1>
              <p className="mt-2 text-sm leading-5 text-ink-muted">{config.subtitle}</p>
            </div>
            {step === 1 && <BoltIcon className="mt-1 h-6 w-6 shrink-0 text-match" />}
          </div>

          {step === 1 && <StepAccount />}

          {step === 2 && (
            <StepIdentity
              username={data.username}
              avatar={data.avatar}
              onUsernameChange={(username) => {
                setData((d) => ({ ...d, username }))
                setUsernameConflict(null)
              }}
              onAvatarChange={(avatar) => setData((d) => ({ ...d, avatar }))}
              onNext={() => setStep(3)}
              serverError={usernameConflict}
            />
          )}

          {step === 3 && (
            <StepGameProfile
              role={data.role}
              mainAgentId={data.mainAgentId}
              rank={data.rank}
              onRoleChange={(role) => setData((d) => ({ ...d, role, roleTouched: true }))}
              // Pré-preenche a função com a do agente, salvo se o jogador já a escolheu. O banco não liga os dois.
              onAgentChange={(agent) =>
                setData((d) => ({ ...d, mainAgentId: agent.id, role: d.roleTouched ? d.role : agent.role }))
              }
              onRankChange={(rank) => setData((d) => ({ ...d, rank }))}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <StepBio
              bio={data.bio}
              onBioChange={(bio) => setData((d) => ({ ...d, bio }))}
              onFinish={finishOnboarding}
              onBack={() => setStep(3)}
              submitting={submitting}
              error={submitError}
            />
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
