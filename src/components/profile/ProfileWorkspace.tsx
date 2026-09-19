import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Agent } from '../../lib/agents'
import { deleteAvatar, uploadAvatar, validateAvatarFile, type StagedAvatar } from '../../lib/avatar'
import { parseSchedule, serializeSchedule, type RoleType } from '../../lib/gameData'
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../types/database'
import { ProfileCard } from '../ProfileCard'
import { AvailabilityPanel } from './AvailabilityPanel'
import { BlockedUsersSection } from './BlockedUsersSection'
import { ProfileFields, type ProfileDraft, type ProfileFieldErrors } from './ProfileFields'

type Status = { kind: 'success' | 'error'; message: string } | null

function toDraft(profile: Tables<'profiles'>): ProfileDraft {
  return {
    username: profile.username,
    role: profile.role,
    mainAgentId: profile.main_agent_id,
    rank: profile.rank,
    bio: profile.bio ?? '',
    schedule: parseSchedule(profile.availability_schedule),
  }
}

function validate(draft: ProfileDraft): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {}
  const username = draft.username.trim()
  if (!username) errors.username = 'Username obrigatório'
  else if (username.length < 3) errors.username = 'Mínimo de 3 caracteres'
  if (!draft.mainAgentId) errors.mainAgent = 'Agente principal obrigatório'
  return errors
}

interface ProfileWorkspaceProps {
  profile: Tables<'profiles'>
  onProfileChange: (profile: Tables<'profiles'>) => void
}

export function ProfileWorkspace({ profile, onProfileChange }: ProfileWorkspaceProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile))
  // Perfil já criado sempre tem função salva: começa true para que trocar o agente nunca a sobrescreva.
  // Só o onboarding (perfil novo) começa false. Se a função for trocada à mão, continua true.
  const [roleTouched, setRoleTouched] = useState(true)
  const [stagedAvatar, setStagedAvatar] = useState<StagedAvatar | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [touched, setTouched] = useState<{ username?: boolean; mainAgent?: boolean }>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)

  const allErrors = validate(draft)
  const errors: ProfileFieldErrors = {
    username: touched.username ? allErrors.username : undefined,
    mainAgent: touched.mainAgent ? allErrors.mainAgent : undefined,
  }

  const saved = toDraft(profile)
  const dirty =
    stagedAvatar !== null ||
    avatarRemoved ||
    draft.username.trim() !== saved.username ||
    draft.role !== saved.role ||
    draft.mainAgentId !== saved.mainAgentId ||
    draft.rank !== saved.rank ||
    draft.bio.trim() !== saved.bio.trim() ||
    serializeSchedule(draft.schedule) !== serializeSchedule(saved.schedule)

  const previewAvatarUrl = stagedAvatar ? stagedAvatar.previewUrl : avatarRemoved ? null : profile.avatar_url

  function patchDraft(patch: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
    setStatus(null)
  }

  function handleRoleChange(role: RoleType) {
    setRoleTouched(true)
    patchDraft({ role })
  }

  // Função e agente são salvos de forma independente; o agente só sugere a função quando ela ainda não foi decidida.
  function handleAgentChange(agent: Agent) {
    patchDraft({ mainAgentId: agent.id, ...(roleTouched ? {} : { role: agent.role }) })
  }

  async function handlePickAvatar(file: File) {
    const result = await validateAvatarFile(file)
    if ('error' in result) {
      setAvatarError(result.error)
      return
    }
    setAvatarError(null)
    if (stagedAvatar) URL.revokeObjectURL(stagedAvatar.previewUrl)
    setStagedAvatar({ file, mime: result.mime, previewUrl: URL.createObjectURL(file) })
    setAvatarRemoved(false)
    setStatus(null)
  }

  function handleRemoveAvatar() {
    if (stagedAvatar) URL.revokeObjectURL(stagedAvatar.previewUrl)
    setStagedAvatar(null)
    setAvatarRemoved(profile.avatar_url !== null)
    setAvatarError(null)
    setStatus(null)
  }

  function handleDiscard() {
    if (stagedAvatar) URL.revokeObjectURL(stagedAvatar.previewUrl)
    setDraft(toDraft(profile))
    setStagedAvatar(null)
    setAvatarRemoved(false)
    setAvatarError(null)
    setTouched({})
    setStatus(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setTouched({ username: true, mainAgent: true })
    if (Object.keys(allErrors).length > 0 || !dirty || saving) return

    setSaving(true)
    setStatus(null)
    try {
      let avatarUrl = profile.avatar_url
      if (stagedAvatar) {
        avatarUrl = await uploadAvatar(profile.id, stagedAvatar.file, stagedAvatar.mime)
      } else if (avatarRemoved) {
        await deleteAvatar(profile.id)
        avatarUrl = null
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: draft.username.trim(),
          avatar_url: avatarUrl,
          bio: draft.bio.trim() || null,
          role: draft.role,
          main_agent_id: draft.mainAgentId,
          rank: draft.rank,
          availability_schedule: serializeSchedule(draft.schedule),
        })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error

      if (stagedAvatar) URL.revokeObjectURL(stagedAvatar.previewUrl)
      setStagedAvatar(null)
      setAvatarRemoved(false)
      setDraft(toDraft(data))
      setTouched({})
      onProfileChange(data)
      setStatus({ kind: 'success', message: 'Perfil atualizado.' })
    } catch {
      setStatus({ kind: 'error', message: 'Não foi possível salvar. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="flex-1 bg-canvas font-inter text-ink">
      <div className="mx-auto w-full max-w-[480px] px-4 pt-6 pb-12 md:max-w-[840px] lg:max-w-[1180px]">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <header className="mb-5 lg:mb-0">
            <h1 className="text-2xl leading-8 font-bold tracking-[-0.02em]">Meu perfil</h1>
            <p className="mt-1 text-sm leading-5 text-ink-muted">
              Veja como os outros jogadores te encontram e edite seus dados.
            </p>
          </header>

          <div className="lg:w-[460px] lg:shrink-0">
            <AvailabilityPanel />
          </div>
        </div>

        <form
          onSubmit={handleSave}
          noValidate
          className="mt-6 grid gap-6 md:grid-cols-[340px_minmax(0,1fr)] md:items-start"
        >
          <div className="contents md:sticky md:top-6 md:block md:space-y-4">
            <div className="order-1 md:order-none">
              <p className="text-[11px] leading-4 font-semibold tracking-[0.04em] text-ink-muted uppercase">
                Como outros te veem
              </p>
              <ProfileCard
                className="mt-3"
                profile={{
                  username: draft.username.trim() || 'Seu username',
                  avatar_url: previewAvatarUrl,
                  role: draft.role,
                  rank: draft.rank,
                  main_agent_id: draft.mainAgentId,
                  bio: draft.bio.trim() || null,
                }}
              />
            </div>

            <div className="order-3 -mt-2 space-y-3 md:order-none md:mt-0">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className="flex-1 cursor-pointer rounded-xl bg-linear-to-r from-brand to-match py-3 text-sm font-semibold text-ink shadow-glow-brand transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:brightness-100"
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={!dirty || saving}
                  className="cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-3 text-sm font-medium text-ink-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-muted"
                >
                  Descartar
                </button>
              </div>
              {status && (
                <p
                  role={status.kind === 'error' ? 'alert' : 'status'}
                  className={`text-sm ${status.kind === 'error' ? 'text-danger' : 'text-ready'}`}
                >
                  {status.message}
                </p>
              )}
            </div>

            <section className="order-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 md:order-none">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-ink-muted">Sessão ativa neste dispositivo</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="shrink-0 cursor-pointer rounded-xl border border-line-strong bg-field px-4 py-2 text-sm font-medium whitespace-nowrap text-ink transition hover:border-danger hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match disabled:cursor-wait disabled:opacity-60"
                >
                  {loggingOut ? 'Saindo...' : 'Sair da conta'}
                </button>
              </div>
              {logoutError && (
                <p role="alert" className="mt-3 text-sm text-danger">
                  Não foi possível encerrar a sessão. Tente novamente.
                </p>
              )}
            </section>

            <BlockedUsersSection />
          </div>

          <div className="order-2 md:order-none">
            <ProfileFields
              draft={draft}
              errors={errors}
              onChange={patchDraft}
              onRoleChange={handleRoleChange}
              onAgentChange={handleAgentChange}
              onBlurField={(field) => setTouched((current) => ({ ...current, [field]: true }))}
              avatarUrl={previewAvatarUrl}
              avatarError={avatarError}
              onPickAvatar={handlePickAvatar}
              onRemoveAvatar={handleRemoveAvatar}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
