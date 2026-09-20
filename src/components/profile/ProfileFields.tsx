import { useRef, type ChangeEvent } from 'react'
import type { Agent } from '../../lib/agents'
import { AVATAR_ACCEPT } from '../../lib/avatar'
import { SCHEDULE_WINDOWS, type RankType, type RoleType, type ScheduleWindow } from '../../lib/gameData'
import { BIO_MAX_LENGTH, USERNAME_FORMAT_HINT, USERNAME_MAX_LENGTH } from '../../lib/profileLimits'
import { AgentSelect } from '../AgentSelect'
import { FormSection as Section } from '../FormSection'
import { focusRing, inputClass, optionClass, smallLabelClass } from '../formStyles'
import { RankSelector } from '../RankSelector'
import { RoleSelector } from '../RoleSelector'

export interface ProfileDraft {
  username: string
  role: RoleType
  mainAgentId: string
  rank: RankType
  bio: string
  schedule: ScheduleWindow[]
}

export interface ProfileFieldErrors {
  username?: string
  mainAgent?: string
}

interface ProfileFieldsProps {
  draft: ProfileDraft
  errors: ProfileFieldErrors
  onChange: (patch: Partial<ProfileDraft>) => void
  // Função e agente têm handlers próprios: escolher o agente pode pré-preencher a função (ver ProfileWorkspace).
  onRoleChange: (role: RoleType) => void
  onAgentChange: (agent: Agent) => void
  onBlurField: (field: 'username' | 'mainAgent') => void
  avatarUrl: string | null
  avatarError: string | null
  onPickAvatar: (file: File) => void
  onRemoveAvatar: () => void
}

export function ProfileFields({
  draft,
  errors,
  onChange,
  onRoleChange,
  onAgentChange,
  onBlurField,
  avatarUrl,
  avatarError,
  onPickAvatar,
  onRemoveAvatar,
}: ProfileFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) onPickAvatar(file)
  }

  function toggleWindow(value: ScheduleWindow) {
    const next = draft.schedule.includes(value)
      ? draft.schedule.filter((w) => w !== value)
      : [...draft.schedule, value]
    onChange({ schedule: next })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <Section title="Identidade">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line-strong bg-field">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar atual" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-ink-muted" aria-hidden="true">
                  {Array.from(draft.username.trim())[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border border-line-strong bg-field px-3.5 py-2 text-sm font-medium text-ink transition hover:border-brand ${focusRing}`}
                >
                  {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    className={`cursor-pointer rounded-lg px-2 py-2 text-sm text-ink-muted transition hover:text-danger ${focusRing}`}
                  >
                    Remover
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">PNG, JPEG ou WebP, até 5 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
              aria-label="Selecionar foto de avatar"
            />
          </div>
          {avatarError && (
            <p role="alert" className="mb-4 -mt-2 text-xs text-danger">
              {avatarError}
            </p>
          )}

          <label htmlFor="profile-username" className={`mb-1.5 block ${smallLabelClass}`}>
            Riot ID
          </label>
          <input
            id="profile-username"
            type="text"
            value={draft.username}
            maxLength={USERNAME_MAX_LENGTH}
            onChange={(e) => onChange({ username: e.target.value })}
            onBlur={() => onBlurField('username')}
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={errors.username ? 'profile-username-error' : 'profile-username-hint'}
            className={inputClass}
            placeholder="Nome#TAG"
          />
          {errors.username ? (
            <p id="profile-username-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.username}
            </p>
          ) : (
            <p id="profile-username-hint" className="mt-1.5 text-xs text-ink-muted">
              {USERNAME_FORMAT_HINT}
            </p>
          )}
        </Section>

        <Section title="Função principal" aside="Selecione 1">
          <RoleSelector value={draft.role} onChange={onRoleChange} />
        </Section>

        <Section title="Agente principal">
          <AgentSelect
            id="profile-main-agent"
            label="Agente principal"
            value={draft.mainAgentId}
            onChange={onAgentChange}
            onBlur={() => onBlurField('mainAgent')}
            invalid={errors.mainAgent !== undefined}
            describedBy={errors.mainAgent ? 'profile-main-agent-error' : undefined}
          />
          {errors.mainAgent && (
            <p id="profile-main-agent-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.mainAgent}
            </p>
          )}
        </Section>
      </div>

      <div className="space-y-4">
        <Section title="Rank" aside="Autodeclarado">
          <RankSelector value={draft.rank} onChange={(rank) => onChange({ rank })} />
        </Section>

        <Section title="Bio">
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="profile-bio" className={smallLabelClass}>
              Bio tática <span className="normal-case">(opcional)</span>
            </label>
            <span className="font-mono text-xs text-ink-muted" aria-live="polite">
              {draft.bio.length}/{BIO_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="profile-bio"
            value={draft.bio}
            maxLength={BIO_MAX_LENGTH}
            rows={3}
            onChange={(e) => onChange({ bio: e.target.value })}
            className={`${inputClass} resize-none`}
            placeholder="Ex: Foco em subir de rank. Call limpa, sem rage."
          />
        </Section>

        <Section title="Horários habituais" aside="Opcional">
          <div className="grid grid-cols-2 gap-3">
            {SCHEDULE_WINDOWS.map((slot) => {
              const selected = draft.schedule.includes(slot.value)
              return (
                <button
                  key={slot.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggleWindow(slot.value)}
                  className={`p-3.5 ${optionClass(selected)}`}
                >
                  <span className="block text-sm font-semibold text-ink">{slot.label}</span>
                  <span className={`mt-0.5 block text-xs ${selected ? 'text-match' : 'text-ink-muted'}`}>
                    {slot.hours}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}
