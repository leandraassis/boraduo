import { useRef, type ChangeEvent, type ReactNode } from 'react'
import { AVATAR_ACCEPT } from '../../lib/avatar'
import {
  RANK_INFO,
  RANK_VALUES,
  ROLE_INFO,
  ROLE_VALUES,
  SCHEDULE_WINDOWS,
  type RankType,
  type RoleType,
  type ScheduleWindow,
} from '../../lib/gameData'
import { RoleIcon } from '../RoleIcon'

export const USERNAME_MAX_LENGTH = 30
export const MAIN_AGENT_MAX_LENGTH = 30
export const BIO_MAX_LENGTH = 50

export interface ProfileDraft {
  username: string
  role: RoleType
  mainAgent: string
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
  onBlurField: (field: 'username' | 'mainAgent') => void
  avatarUrl: string | null
  avatarError: string | null
  onPickAvatar: (file: File) => void
  onRemoveAvatar: () => void
}

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-match'

const inputClass =
  'w-full rounded-xl border border-line bg-field px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted transition focus:border-brand focus:shadow-[inset_0_0_8px_rgba(124,58,237,0.1)] focus:outline-none'

const smallLabelClass = 'text-[11px] leading-4 font-semibold tracking-[0.04em] uppercase text-ink-muted'

function optionClass(selected: boolean) {
  return `cursor-pointer rounded-xl border text-left transition ${focusRing} ${
    selected ? 'border-brand bg-brand/15 text-ink' : 'border-line bg-field text-ink-muted hover:border-line-strong'
  }`
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base leading-[22px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {aside && <span className={smallLabelClass}>{aside}</span>}
      </div>
      {children}
    </section>
  )
}

export function ProfileFields({
  draft,
  errors,
  onChange,
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
            Username
          </label>
          <input
            id="profile-username"
            type="text"
            value={draft.username}
            maxLength={USERNAME_MAX_LENGTH}
            onChange={(e) => onChange({ username: e.target.value })}
            onBlur={() => onBlurField('username')}
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={errors.username ? 'profile-username-error' : undefined}
            className={inputClass}
            placeholder="Seu nome no jogo"
          />
          {errors.username && (
            <p id="profile-username-error" role="alert" className="mt-1.5 text-xs text-danger">
              {errors.username}
            </p>
          )}
        </Section>

        <Section title="Função principal" aside="Selecione 1">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Função no jogo">
            {ROLE_VALUES.map((value) => {
              const selected = draft.role === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ role: value })}
                  className={`p-3.5 ${optionClass(selected)}`}
                >
                  <span className={selected ? 'text-match' : 'text-ink-muted'}>
                    <RoleIcon role={value} className="h-5 w-5" />
                  </span>
                  <span className="mt-2.5 block text-sm font-semibold text-ink">{ROLE_INFO[value].label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-ink-muted">
                    {ROLE_INFO[value].description}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="Agente principal">
          <label htmlFor="profile-main-agent" className="sr-only">
            Agente principal
          </label>
          <input
            id="profile-main-agent"
            type="text"
            value={draft.mainAgent}
            maxLength={MAIN_AGENT_MAX_LENGTH}
            onChange={(e) => onChange({ mainAgent: e.target.value })}
            onBlur={() => onBlurField('mainAgent')}
            aria-invalid={errors.mainAgent ? true : undefined}
            aria-describedby={errors.mainAgent ? 'profile-main-agent-error' : undefined}
            className={inputClass}
            placeholder="Ex: Jett, Sova, Omen..."
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
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Rank">
            {RANK_VALUES.map((value) => {
              const selected = draft.rank === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange({ rank: value })}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 ${optionClass(selected)}`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full ring-1 ring-black/30"
                    style={{ backgroundColor: RANK_INFO[value].color }}
                    aria-hidden="true"
                  />
                  <span className={`text-xs font-medium ${selected ? 'text-ink' : 'text-ink-muted'}`}>
                    {RANK_INFO[value].label}
                  </span>
                </button>
              )
            })}
          </div>
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
