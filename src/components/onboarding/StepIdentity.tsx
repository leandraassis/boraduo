import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AVATAR_ACCEPT, validateAvatarFile, type StagedAvatar } from '../../lib/avatar'
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../../lib/profileLimits'
import { TextField } from '../auth/TextField'
import { FormSection } from '../FormSection'
import { focusRing, primaryButtonClass } from '../formStyles'
import { ArrowRightIcon, CameraIcon, UserIcon } from '../icons'

interface StepIdentityProps {
  username: string
  avatar: StagedAvatar | null
  onUsernameChange: (value: string) => void
  onAvatarChange: (avatar: StagedAvatar | null) => void
  onNext: () => void
}

export function StepIdentity({ username, avatar, onUsernameChange, onAvatarChange, onNext }: StepIdentityProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [touched, setTouched] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const trimmed = username.trim()
  const usernameError =
    trimmed.length === 0
      ? 'Username obrigatório'
      : trimmed.length < USERNAME_MIN_LENGTH
        ? `Mínimo de ${USERNAME_MIN_LENGTH} caracteres`
        : null

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const result = await validateAvatarFile(file)
    if ('error' in result) {
      setAvatarError(result.error)
      return
    }
    setAvatarError(null)
    if (avatar) URL.revokeObjectURL(avatar.previewUrl)
    onAvatarChange({ file, mime: result.mime, previewUrl: URL.createObjectURL(file) })
  }

  function handleRemove() {
    if (avatar) URL.revokeObjectURL(avatar.previewUrl)
    setAvatarError(null)
    onAvatarChange(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (usernameError) return
    onNext()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormSection title="Avatar de combate" aside="Opcional">
        <div className="flex flex-col items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={avatar ? 'Trocar foto do avatar' : 'Adicionar foto do avatar'}
              className={`block cursor-pointer rounded-full bg-linear-to-br from-brand to-match p-[3px] ${focusRing}`}
            >
              <span className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-field text-ink-muted">
                {avatar ? (
                  <img src={avatar.previewUrl} alt="Preview do avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 px-3 text-center text-xs">
                    <UserIcon className="h-8 w-8" />
                    Adicionar foto
                  </span>
                )}
              </span>
            </button>
            <span className="pointer-events-none absolute right-0 bottom-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-surface bg-match text-canvas">
              <CameraIcon className="h-4 w-4" />
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            aria-label="Selecionar foto de avatar"
          />

          <div className="mt-4 flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg py-1 font-medium text-match hover:underline ${focusRing}`}
            >
              {avatar ? 'Trocar foto' : 'Escolher foto'}
            </button>
            {avatar && (
              <>
                <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleRemove}
                  className={`cursor-pointer rounded-lg py-1 text-ink-muted transition hover:text-danger ${focusRing}`}
                >
                  Remover foto
                </button>
              </>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">PNG, JPEG ou WebP, até 5 MB. Você pode pular esta parte.</p>
          {avatarError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {avatarError}
            </p>
          )}
        </div>
      </FormSection>

      <FormSection title="Username">
        <TextField
          id="username"
          label="Username"
          hideLabel
          value={username}
          onChange={onUsernameChange}
          onBlur={() => setTouched(true)}
          maxLength={USERNAME_MAX_LENGTH}
          placeholder="Seu nome no jogo"
          autoComplete="nickname"
          icon={<UserIcon className="h-5 w-5" />}
          error={touched ? usernameError : null}
        />
        <p className="mt-2 text-xs text-ink-muted">
          Entre {USERNAME_MIN_LENGTH} e {USERNAME_MAX_LENGTH} caracteres. É assim que os outros vão te chamar.
        </p>
      </FormSection>

      <button type="submit" className={primaryButtonClass}>
        Continuar para perfil de jogo
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </form>
  )
}
