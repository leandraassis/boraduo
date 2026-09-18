const MAX_BIO_LENGTH = 50

interface StepBioProps {
  bio: string
  onBioChange: (value: string) => void
  onFinish: (bio: string | null) => void
  submitting: boolean
  error: string | null
}

export function StepBio({ bio, onBioChange, onFinish, submitting, error }: StepBioProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-neutral-300">
          Bio <span className="text-neutral-500">(opcional)</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          maxLength={MAX_BIO_LENGTH}
          onChange={(e) => onBioChange(e.target.value.slice(0, MAX_BIO_LENGTH))}
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
          placeholder="Conte um pouco sobre seu estilo de jogo"
        />
        <p className="mt-1 text-right text-xs text-neutral-500">
          {bio.length}/{MAX_BIO_LENGTH}
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onFinish(null)}
          disabled={submitting}
          className="flex-1 rounded-lg border border-neutral-700 py-2 font-medium text-neutral-300 transition hover:border-neutral-500 disabled:opacity-50"
        >
          Pular
        </button>
        <button
          type="button"
          onClick={() => onFinish(bio.trim() || null)}
          disabled={submitting}
          className="flex-1 rounded-lg bg-purple-600 py-2 font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? 'Concluindo...' : 'Concluir'}
        </button>
      </div>
    </div>
  )
}
