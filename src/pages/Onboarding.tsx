import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress'
import { StepAccount } from '../components/onboarding/StepAccount'
import { StepBio } from '../components/onboarding/StepBio'
import { StepGameProfile } from '../components/onboarding/StepGameProfile'
import { StepIdentity } from '../components/onboarding/StepIdentity'
import { useProfile } from '../hooks/useProfile'
import { useSession } from '../hooks/useSession'
import { uploadAvatar, type StagedAvatar } from '../lib/avatar'
import { supabase } from '../lib/supabase'
import type { Enums } from '../types/database'

interface OnboardingData {
  username: string
  avatar: StagedAvatar | null
  role: Enums<'role_type'> | null
  mainAgent: string
  rank: Enums<'rank_type'> | null
  bio: string
}

const INITIAL_DATA: OnboardingData = {
  username: '',
  avatar: null,
  role: null,
  mainAgent: '',
  rank: null,
  bio: '',
}

export function Onboarding() {
  const navigate = useNavigate()
  const { session, loading: sessionLoading } = useSession()
  const { profile, loading: profileLoading } = useProfile(session?.user.id)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (session && step === 1) {
    setStep(2)
  }

  if (!sessionLoading && session && !profileLoading && profile) {
    return <Navigate to="/app" replace />
  }

  async function finishOnboarding(bio: string | null) {
    if (!session || !data.role || !data.rank) return

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
      main_agent: data.mainAgent.trim(),
      rank: data.rank,
    })

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
        <OnboardingProgress step={step} />

        {step === 1 && <StepAccount />}

        {step === 2 && (
          <StepIdentity
            username={data.username}
            avatar={data.avatar}
            onUsernameChange={(username) => setData((d) => ({ ...d, username }))}
            onAvatarChange={(avatar) => setData((d) => ({ ...d, avatar }))}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepGameProfile
            role={data.role}
            mainAgent={data.mainAgent}
            rank={data.rank}
            onRoleChange={(role) => setData((d) => ({ ...d, role }))}
            onMainAgentChange={(mainAgent) => setData((d) => ({ ...d, mainAgent }))}
            onRankChange={(rank) => setData((d) => ({ ...d, rank }))}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepBio
            bio={data.bio}
            onBioChange={(bio) => setData((d) => ({ ...d, bio }))}
            onFinish={finishOnboarding}
            submitting={submitting}
            error={submitError}
          />
        )}
      </div>
    </div>
  )
}
