import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AVATAR_ACCEPT, validateAvatarFile, type StagedAvatar } from '../../lib/avatar'

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
    trimmed.length === 0 ? 'Username obrigatório' : trimmed.length < 3 ? 'Mínimo de 3 caracteres' : null

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
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-700 bg-neutral-900 text-neutral-500 transition hover:border-purple-500"
        >
          {avatar ? (
            <img src={avatar.previewUrl} alt="Preview do avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs">Adicionar foto</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
        {avatar && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Remover foto
          </button>
        )}
        <p className="text-xs text-neutral-500">Opcional — você pode pular esta parte</p>
        {avatarError && (
          <p role="alert" className="text-xs text-red-400">
            {avatarError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-neutral-300">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
          placeholder="Seu nome de invocador"
        />
        {touched && usernameError && <p className="mt-1 text-xs text-red-400">{usernameError}</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition hover:bg-purple-500"
      >
        Continuar
      </button>
    </form>
  )
}
